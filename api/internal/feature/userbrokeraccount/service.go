package userbrokeraccount

import (
	"arthveda/internal/apires"
	"arthveda/internal/common"
	"arthveda/internal/domain/broker_integration"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/domain/types"
	"arthveda/internal/env"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
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

func (s *Service) Create(ctx context.Context, userID uuid.UUID, enforcer *subscription.PlanEnforcer, payload CreatePayload) (*UserBrokerAccount, service.Error, error) {
	accounts, err := s.userBrokerAccountRepository.ListByUserID(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list: %w", err)
	}

	if !enforcer.CanAddUserBrokerAccount(len(accounts)) {
		return nil, service.ErrPlanLimitExceeded, subscription.NewPlanLimitError(subscription.FeatureAddUserBrokerAccount)
	}

	if err := validateBrokerAccountName(payload.Name); err != nil {
		return nil, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError("", "Broker account name must be between 1 and 63 characters", "name", payload.Name))
	}

	// Validate broker exists
	_, err = s.brokerRepository.GetByID(ctx, payload.BrokerID)
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

	secretEncrypted, nonce, err := common.Encrypt([]byte(payload.ClientSecret), []byte(env.CIPHER_KEY))
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("encrypt client secret: %w", err)
	}

	now := time.Now().UTC()
	uba.UpdatedAt = &now
	uba.OAuthClientID = &payload.ClientID
	uba.OAuthClientSecretBytes = secretEncrypted
	uba.OAuthClientSecretNonce = nonce

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

	// TODO: Call logout/disconnect API of the broker if supported.

	now := time.Now().UTC()

	uba.UpdatedAt = &now
	uba.OAuthClientID = nil
	uba.OAuthClientSecretBytes = nil
	uba.OAuthClientSecretNonce = nil
	uba.AccessTokenBytes = nil
	uba.AccessTokenBytesNonce = nil

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return service.ErrNone, nil
}

type SyncResult struct {
	LoginRequired    bool                     `json:"login_required"`
	LoginURL         string                   `json:"login_url"`
	Broker           *broker.Broker           `json:"-"`
	ImportableTrades []*types.ImportableTrade `json:"-"`
}

func (s *Service) Sync(ctx context.Context, userID, ubaID uuid.UUID) (*SyncResult, service.Error, error) {
	l := logger.FromCtx(ctx)

	uba, err := s.userBrokerAccountRepository.GetByID(ctx, ubaID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Broker Account not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get account: %w", err)
	}

	ubaBroker, err := s.brokerRepository.GetByID(ctx, uba.BrokerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker not found")
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("get broker: %w", err)
	}

	if !ubaBroker.SupportsTradeSync {
		return nil, service.ErrBadRequest, fmt.Errorf("Sync is not suppored for broker %s", ubaBroker.Name)
	}

	if !uba.IsConnected {
		return nil, service.ErrBadRequest, fmt.Errorf("Broker account is not connected")
	}

	var clientID, clientSecret string

	if ubaBroker.Name == broker.BrokerNameZerodha {
		// For Zerodha, we don't need users to provide clientID and secret.
		clientID = env.ZERODHA_API_KEY
		clientSecret = env.ZERODHA_API_SECRET
	} else {
		if uba.OAuthClientID != nil {
			clientID = *uba.OAuthClientID
		}

		secretEncypred := uba.OAuthClientSecretBytes
		secretNonce := uba.OAuthClientSecretNonce

		clientSecret, err = common.Decrypt(secretEncypred, secretNonce, []byte(env.CIPHER_KEY))
		if err != nil {
			l.Warnw("Failed to decrypt client secret. Disconnecting...", "uba_id", uba.ID, "error", err.Error())
			s.Disconnect(ctx, userID, uba.ID)
			return nil, service.ErrInternalServerError, fmt.Errorf("decrypt client secret: %w", err)
		}

		// We checked this above via `uba.IsConnected`, but let's ensure we have valid clientID and secret.
		if clientID == "" || clientSecret == "" {
			return nil, service.ErrBadRequest, errors.New("Broker account is not connected")
		}
	}

	adapter, err := broker_integration.GetAPIAdapter(ubaBroker, clientID, clientSecret)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("Get API adapter: %w", err)
	}

	loginURL := adapter.GetLoginURL(ctx, userID, uba.ID)
	redirectToLoginResult := &SyncResult{
		LoginRequired: true,
		LoginURL:      loginURL,
	}

	tokenEncypred := uba.AccessTokenBytes
	tokenNonce := uba.AccessTokenBytesNonce

	if len(tokenEncypred) == 0 || len(tokenNonce) == 0 {
		l.Infow("Access token not found. Redirecting to login", "uba_id", uba.ID)
		return redirectToLoginResult, service.ErrNone, nil
	}

	accessToken, err := common.Decrypt(tokenEncypred, tokenNonce, []byte(env.CIPHER_KEY))
	if err != nil {
		l.Warnw("Failed to decrypt access token. Disconnecting...", "uba_id", uba.ID, "error", err.Error())
		s.Disconnect(ctx, userID, uba.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("decrypt access token: %w", err)
	}

	if accessToken == "" {
		return redirectToLoginResult, service.ErrNone, nil
	}

	// Create a new Kite connect instance
	kc := kiteconnect.New(clientID)

	// Set access token
	kc.SetAccessToken(accessToken)

	now := time.Now().UTC()

	trades, err := kc.GetTrades()
	if err != nil {
		l.Errorw("Failed to get trades", "error", err.Error())
		uba.AccessTokenBytes = nil
		s.userBrokerAccountRepository.Update(ctx, uba)
		return redirectToLoginResult, service.ErrBadRequest, nil
	}

	importableTrades := []*types.ImportableTrade{}
	for _, t := range trades {
		symbol := t.TradingSymbol
		instrument := trade.GetInstrumentFromSymbol(symbol)

		// NOTE: Fetch exchange timezone. Using NSE because we only suport sync for Indian brokers.
		tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
		ist, err := time.LoadLocation(string(tz))
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("Failed to load timezone for trade: %s", tz)
		}

		tradeTime := t.FillTimestamp.Time.In(ist)
		tradeKind := types.TradeKind(strings.ToLower(t.TransactionType))

		importableTrade := types.ImportableTrade{
			Symbol:     symbol,
			Instrument: instrument,
			TradeKind:  tradeKind,
			Quantity:   decimal.NewFromFloat(t.Quantity),
			Price:      decimal.NewFromFloat(t.AveragePrice),
			OrderID:    t.OrderID,
			Time:       tradeTime,
		}
		importableTrades = append(importableTrades, &importableTrade)
	}

	uba.LastSyncAt = &now

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return &SyncResult{
		LoginRequired:    false,
		LoginURL:         "",
		ImportableTrades: importableTrades,
		Broker:           ubaBroker,
	}, service.ErrNone, nil
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
		l.Warnw("Unauthorized access to broker account. Disconnecting...", "uba_id", uba.ID)
		s.Disconnect(ctx, userID, uba.ID)
		return service.ErrUnauthorized, fmt.Errorf("Unauthorized access to broker account")
	}

	apiKey := env.ZERODHA_API_KEY
	apiSecret := env.ZERODHA_API_SECRET

	if apiKey == "" || apiSecret == "" {
		return service.ErrInternalServerError, fmt.Errorf("Zerodha API key or secret not configured")
	}

	kc := kiteconnect.New(apiKey)

	// Get user details and access token
	data, err := kc.GenerateSession(requestToken, apiSecret)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("generate session: %w", err)
	}

	accessToken := data.AccessToken
	refreshToken := data.RefreshToken

	l.Debugw("Zerodha redirect successful", "uba_id", uba.ID, "access_token", accessToken, "refresh_token", refreshToken)

	// Encrypt access token
	accessTokenEncrypted, accessTokenNonce, err := common.Encrypt([]byte(accessToken), []byte(env.CIPHER_KEY))
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("encrypt access token: %w", err)
	}

	now := time.Now().UTC()
	uba.UpdatedAt = &now
	uba.AccessTokenBytes = accessTokenEncrypted
	uba.AccessTokenBytesNonce = accessTokenNonce
	uba.LastLoginAt = &now

	_, err = s.userBrokerAccountRepository.Update(ctx, uba)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("update account: %w", err)
	}

	return service.ErrNone, nil
}
