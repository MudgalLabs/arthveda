package subscription

import (
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/PaddleHQ/paddle-go-sdk"
	"github.com/google/uuid"
)

type Service struct {
	subscriptionRepository ReadWriter
}

func NewService(sr ReadWriter) *Service {
	return &Service{
		subscriptionRepository: sr,
	}
}

type CreatePayload struct {
	UserID          uuid.UUID
	ValidUntil      time.Time
	BillingInterval BillingInterval
	Provider        PaymentProvider
	ExternalRef     string
}

func (s *Service) Create(ctx context.Context, payload CreatePayload) error {
	l := logger.FromCtx(ctx)
	now := time.Now().UTC()

	sub := &UserSubscription{
		UserID:          payload.UserID,
		PlanID:          PlanPro,
		Status:          StatusActive,
		ValidFrom:       now,
		ValidUntil:      payload.ValidUntil,
		BillingInterval: payload.BillingInterval,
		Provider:        ProviderPaddle,
		ExternalRef:     payload.ExternalRef,
		CreatedAt:       now,
	}

	err := s.subscriptionRepository.UpsertUserSubscription(ctx, sub)
	if err != nil {
		return fmt.Errorf("failed to upsert user subscription: %w", err)
	}

	event := &UserSubscriptionEvent{
		ID:         uuid.New(),
		UserID:     payload.UserID,
		EventType:  EventSubscribed,
		Provider:   ProviderPaddle,
		OccurredAt: now,
	}

	err = s.subscriptionRepository.CreateUserSubscriptionEvent(ctx, event)
	if err != nil {
		l.Errorw("failed to create user subscription event", "error", err)
	}

	return nil
}

func (s *Service) Cancelled(ctx context.Context, userID uuid.UUID) error {
	l := logger.FromCtx(ctx)

	subscription, err := s.subscriptionRepository.FindUserSubscriptionByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to find user subscription: %w", err)
	}

	now := time.Now().UTC()

	subscription.Status = StatusCanceled
	subscription.ValidUntil = now
	subscription.UpdatedAt = &now
	err = s.subscriptionRepository.UpsertUserSubscription(ctx, subscription)
	if err != nil {
		return fmt.Errorf("failed to update user subscription status: %w", err)
	}

	event := &UserSubscriptionEvent{
		ID:         uuid.New(),
		UserID:     userID,
		EventType:  EventCanceled,
		Provider:   ProviderPaddle,
		OccurredAt: now,
	}

	err = s.subscriptionRepository.CreateUserSubscriptionEvent(ctx, event)
	if err != nil {
		l.Errorw("failed to create user subscription event", "error", err)
	}

	return nil
}

func (s *Service) CancelAtPeriodEnd(ctx context.Context, userID uuid.UUID) (service.Error, error) {
	l := logger.FromCtx(ctx)

	subscription, err := s.subscriptionRepository.FindUserSubscriptionByUserID(ctx, userID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, errors.New("Subscription not found")
		}
		return service.ErrInternalServerError, fmt.Errorf("failed to find user subscription: %w", err)
	}

	if subscription.Status != StatusActive {
		l.Infow("subscription is not active, cannot cancel at period end", "status", subscription.Status)
		return service.ErrNone, nil
	}

	if subscription.CancelAtPeriodEnd {
		l.Infow("subscription is already set to cancel at period end")
		return service.ErrNone, nil
	}

	paddleClient, err := GetPaddleClient()
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to get paddle client: %w", err)
	}

	req := &paddle.CancelSubscriptionRequest{
		SubscriptionID: subscription.ExternalRef,
	}
	_, err = paddleClient.CancelSubscription(ctx, req)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to cancel subscription with paddle api: %w", err)
	}

	now := time.Now().UTC()
	subscription.CancelAtPeriodEnd = true
	subscription.UpdatedAt = &now
	err = s.subscriptionRepository.UpsertUserSubscription(ctx, subscription)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to update user subscription status: %w", err)
	}

	return service.ErrNone, nil
}

func (s *Service) CreateOrUpdateUserSubscriptionInvoice(ctx context.Context, invoice *UserSubscriptionInvoice) error {
	err := s.subscriptionRepository.UpsertUserSubscriptionInvoice(ctx, invoice)
	if err != nil {
		return fmt.Errorf("failed to upsert user subscription invoice: %w", err)
	}
	return nil
}

type CreatePaymentProviderProfilePayload struct {
	Email      string
	Provider   PaymentProvider
	ExternalID string
	RawData    json.RawMessage
}

func (s *Service) CreateOrUpdatePaymentProviderProfileForUser(ctx context.Context, payload *CreatePaymentProviderProfilePayload) error {
	profile := &UserPaymentProviderProfile{
		UserID:     uuid.Nil, // Will be set later by UpsertPaymentProviderProfile.
		Provider:   payload.Provider,
		ExternalID: payload.ExternalID,
		Metadata:   payload.RawData,
		CreatedAt:  time.Now().UTC(),
	}
	err := s.subscriptionRepository.UpsertPaymentProviderProfile(ctx, payload.Email, profile)
	if err != nil {
		return fmt.Errorf("failed to upsert payment provider profile: %w", err)
	}

	return nil
}

func (s *Service) Expired(ctx context.Context, provider PaymentProvider, externalRef string) error {
	l := logger.FromCtx(ctx)

	subscription, err := s.subscriptionRepository.FindUserSubscriptionByExternalRef(ctx, provider, externalRef)
	if err != nil {
		return fmt.Errorf("failed to find the existing user subscription that expired: %w", err)
	}

	now := time.Now().UTC()

	subscription.Status = StatusExpired
	subscription.ValidUntil = now
	subscription.UpdatedAt = &now
	err = s.subscriptionRepository.UpsertUserSubscription(ctx, subscription)
	if err != nil {
		return fmt.Errorf("failed to update user subscription status: %w", err)
	}

	event := &UserSubscriptionEvent{
		ID:         uuid.New(),
		UserID:     subscription.UserID,
		EventType:  EventExpired,
		Provider:   ProviderPaddle,
		OccurredAt: now,
	}

	err = s.subscriptionRepository.CreateUserSubscriptionEvent(ctx, event)
	if err != nil {
		l.Errorw("failed to create user subscription event", "error", err)
	}

	return nil
}

func (s *Service) ListUserSubscriptionInvoices(ctx context.Context, userID uuid.UUID) ([]*UserSubscriptionInvoice, service.Error, error) {
	invoices, err := s.subscriptionRepository.ListUserSubscriptionInvoicesByUserID(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list user subscription invoices: %w", err)
	}
	return invoices, service.ErrNone, nil
}

func (s *Service) GetUserSubscriptionInvoiceDownloadLink(ctx context.Context, invoiceID uuid.UUID) (string, service.Error, error) {
	l := logger.FromCtx(ctx)

	invoice, err := s.subscriptionRepository.FindUserSubscriptionInvoiceByID(ctx, invoiceID)
	if err != nil {
		if err == repository.ErrNotFound {
			return "", service.ErrNotFound, fmt.Errorf("Invoice not found")
		}
		return "", service.ErrInternalServerError, fmt.Errorf("find user subscription invoice by id: %w", err)
	}

	if invoice.Provider != ProviderPaddle {
		return "", service.ErrInternalServerError, fmt.Errorf("unsupported payment provider: %s", invoice.Provider)
	}

	client, err := GetPaddleClient()
	if err != nil {
		l.Errorw("failed to get paddle client", "error", err)
		return "", service.ErrInternalServerError, err
	}

	req := &paddle.GetTransactionInvoiceRequest{
		TransactionID: invoice.ExternalID,
	}

	res, err := client.GetTransactionInvoice(ctx, req)
	if err != nil {
		l.Errorw("failed to get transaction invoice", "error", err)
		return "", service.ErrInternalServerError, err
	}

	downloadLink := res.URL
	return downloadLink, service.ErrNone, nil
}
