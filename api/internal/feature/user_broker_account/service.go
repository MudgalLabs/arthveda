package user_broker_account

import (
	"arthveda/internal/apires"
	"arthveda/internal/feature/broker"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
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
