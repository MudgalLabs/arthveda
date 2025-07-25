package subscription

import (
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
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

	l.Infow("Creating User Subscription:", "subscription", sub)

	err := s.subscriptionRepository.UpsertUserSubscription(ctx, sub)
	if err != nil {
		return fmt.Errorf("failed to upsert user subscription: %w", err)
	}

	return nil
}

func (s *Service) Cancelled(ctx context.Context, userID uuid.UUID) error {
	l := logger.FromCtx(ctx)

	l.Infow("Cancelling User Subscription for user", "user_id", userID)

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

	return nil
}

func (s *Service) CancelAtPeriodEnd(ctx context.Context, userID uuid.UUID) (service.Error, error) {
	l := logger.FromCtx(ctx)

	l.Infow("Cancelling User Subscription at period end for user", "user_id", userID)

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

	paddleClient, err := getPaddleClient()
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
