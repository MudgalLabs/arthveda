package user_broker_account

import (
	"arthveda/internal/apires"
	"arthveda/internal/domain/broker_integration"
	"arthveda/internal/feature/broker"
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	kiteconnect "github.com/zerodha/gokiteconnect/v4"
)

type Service struct {
	userBrokerAccountRepository ReadWriter
	brokerRepository            broker.Reader
}

func NewService(ubar ReadWriter, br broker.Reader) *Service {
	return &Service{
		userBrokerAccountRepository: ubar,
		brokerRepository:            br,
	}
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, payload CreatePayload) (*UserBrokerAccount, service.Error, error) {
	if err := validateBrokerAccountName(payload.Name); err != nil {
		return nil, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError("", "Broker account name must be between 1 and 63 characters", "name", payload.Name))
	}

	// Validate broker exists
	_, err := s.brokerRepository.GetByID(ctx, payload.BrokerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get broker: %w", err)
	}

	// Check if account with same name already exists for this user and broker
	exists, err := s.userBrokerAccountRepository.ExistsByNameAndBrokerIDAndUserID(ctx, payload.Name, payload.BrokerID, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("check exists: %w", err)
	}

	if exists {
		return nil, service.ErrBadRequest, fmt.Errorf("Account with name %s already exists for this broker", payload.Name)
	}

	account, err := new(userID, payload)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("create new account: %w", err)
	}

	createdAccount, err := s.userBrokerAccountRepository.Create(ctx, account)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("create: %w", err)
	}

	return createdAccount, service.ErrNone, nil
}

func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]*UserBrokerAccount, service.Error, error) {
	accounts, err := s.userBrokerAccountRepository.ListByUserID(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list: %w", err)
	}

	return accounts, service.ErrNone, nil
}

func (s *Service) Update(ctx context.Context, userID, accountID uuid.UUID, payload UpdatePayload) (*UserBrokerAccount, service.Error, error) {
	if err := validateBrokerAccountName(payload.Name); err != nil {
		return nil, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError("", "Broker account name must be between 1 and 63 characters", "name", payload.Name))
	}

	account, err := s.userBrokerAccountRepository.GetByID(ctx, accountID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get account: %w", err)
	}

	// Verify ownership
	if account.UserID != userID {
		return nil, service.ErrNotFound, fmt.Errorf("Broker Account not found")
	}

	// Check if new name conflicts with existing accounts for this user and broker
	if account.Name != payload.Name {
		exists, err := s.userBrokerAccountRepository.ExistsByNameAndBrokerIDAndUserID(ctx, payload.Name, account.BrokerID, userID)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("check exists: %w", err)
		}

		if exists {
			return nil, service.ErrBadRequest, fmt.Errorf("Account with name %s already exists for this broker", payload.Name)
		}
	}

	now := time.Now().UTC()
	account.UpdatedAt = &now
	account.Name = payload.Name

	updatedAccount, err := s.userBrokerAccountRepository.Update(ctx, account)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("update: %w", err)
	}

	return updatedAccount, service.ErrNone, nil
}

func (s *Service) Delete(ctx context.Context, userID, accountID uuid.UUID) (service.Error, error) {
	account, err := s.userBrokerAccountRepository.GetByID(ctx, accountID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, fmt.Errorf("account not found")
		}
		return service.ErrInternalServerError, fmt.Errorf("get account: %w", err)
	}

	// Verify ownership
	if account.UserID != userID {
		return service.ErrNotFound, fmt.Errorf("Broker Account not found")
	}

	err = s.userBrokerAccountRepository.Delete(ctx, accountID)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("delete: %w", err)
	}

	return service.ErrNone, nil
}

type connectResult struct {
	LoginURL string `json:"login_url"`
}

func (s *Service) Connect(ctx context.Context, userID, ubaID uuid.UUID, payload ConnectPayload) (*connectResult, service.Error, error) {
	uba, err := s.userBrokerAccountRepository.GetByID(ctx, ubaID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get by id: %w", err)
	}

	b, err := s.brokerRepository.GetByID(ctx, uba.BrokerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get broker: %w", err)
	}

	if !b.SupportsTradeSync {
		return nil, service.ErrBadRequest, fmt.Errorf("Connect is not suppored for broker %s", b.Name)
	}

	adapter, err := broker_integration.GetAPIAdapter(b, payload.ClientID, payload.ClientSecret)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("Get API adapter: %w", err)
	}

	url := adapter.GetLoginURL(ctx, userID, uba.ID)
	result := &connectResult{
		LoginURL: url,
	}

	now := time.Now().UTC()
	uba.UpdatedAt = &now
	uba.OAuthClientID = &payload.ClientID
	uba.OAuthClientSecret = &payload.ClientSecret
	uba.IsConnected = false

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("update user broker account: %w", err)
	}

	return result, service.ErrNone, nil
}

func (s *Service) Disconnect(ctx context.Context, userID, ubaID uuid.UUID) (service.Error, error) {
	uba, err := s.userBrokerAccountRepository.GetByID(ctx, ubaID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return service.ErrInternalServerError, fmt.Errorf("get by id: %w", err)
	}

	// TODO: Call disconnect method of the syncer.

	now := time.Now().UTC()

	uba.UpdatedAt = &now
	uba.OAuthClientID = nil
	uba.OAuthClientSecret = nil
	uba.AccessToken = nil

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return service.ErrNone, nil
}

type syncResult struct {
	LoginRequired bool   `json:"login_required"`
	LoginURL      string `json:"login_url"`
}

func (s *Service) Sync(ctx context.Context, userID, ubaID uuid.UUID) (*syncResult, service.Error, error) {
	l := logger.FromCtx(ctx)

	uba, err := s.userBrokerAccountRepository.GetByID(ctx, ubaID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get account: %w", err)
	}

	b, err := s.brokerRepository.GetByID(ctx, uba.BrokerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get broker: %w", err)
	}

	if !b.SupportsTradeSync {
		return nil, service.ErrBadRequest, fmt.Errorf("Sync is not suppored for broker %s", b.Name)
	}

	if !uba.IsConnected {
		return nil, service.ErrBadRequest, fmt.Errorf("Broker account is not connected")
	}

	clientID := uba.OAuthClientID
	clientSecret := uba.OAuthClientSecret
	accessToken := uba.AccessToken

	if clientID == nil || *clientID == "" || clientSecret == nil || *clientSecret == "" {
		return nil, service.ErrBadRequest, errors.New("Broker account is not connected")
	}

	adapter, err := broker_integration.GetAPIAdapter(b, *clientID, *clientSecret)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("Get API adapter: %w", err)
	}

	loginURL := adapter.GetLoginURL(ctx, userID, uba.ID)
	redirectToLoginResult := &syncResult{
		LoginRequired: true,
		LoginURL:      loginURL,
	}

	// Create a new Kite connect instance
	kc := kiteconnect.New(*clientID)

	if accessToken == nil || *accessToken == "" {
		return redirectToLoginResult, service.ErrNone, nil
	}

	// Set access token
	kc.SetAccessToken(*accessToken)

	margin, _ := kc.GetUserMargins()
	fmt.Println("############################################################   margin: ", margin)

	now := time.Now().UTC()

	trades, err := kc.GetTrades()
	if err != nil {
		l.Errorw("Failed to get trades", "error", err.Error())

		uba.AccessToken = nil
		s.userBrokerAccountRepository.Update(ctx, uba)
		return redirectToLoginResult, service.ErrBadRequest, nil
	}

	fmt.Println("############################################################   trades: ", trades)

	uba.LastSyncAt = &now

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return &syncResult{}, service.ErrNone, nil
}

func (s *Service) ZerodhaRedirect(ctx context.Context, userID, ubaID uuid.UUID, requestToken string) (service.Error, error) {
	l := logger.FromCtx(ctx)

	uba, err := s.userBrokerAccountRepository.GetByID(ctx, ubaID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return service.ErrInternalServerError, fmt.Errorf("get account: %w", err)
	}

	if uba.UserID != userID {
		return service.ErrUnauthorized, errors.New("Unauthorized access to broker account")
	}

	apiKey := uba.OAuthClientID
	apiSecret := uba.OAuthClientSecret

	if apiKey == nil || apiSecret == nil || *apiKey == "" || *apiSecret == "" {
		return service.ErrBadRequest, errors.New("Broker account is not connected")
	}

	kc := kiteconnect.New(*apiKey)

	// Get user details and access token
	data, err := kc.GenerateSession(requestToken, *apiSecret)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("generate session: %w", err)
	}

	accessToken := data.AccessToken
	refreshToken := data.RefreshToken

	l.Debugw("Zerodha redirect successful", "uba_id", uba.ID, "access_token", accessToken, "refresh_token", refreshToken)

	now := time.Now().UTC()
	uba.UpdatedAt = &now
	uba.AccessToken = &accessToken
	uba.LastLoginAt = &now

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return service.ErrNone, nil
}
