package userprofile

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/currency"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/upload"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	userProfileRepository  ReadWriter
	subscriptionRepository subscription.Reader
	positionRepository     position.Reader
	uploadRepository       upload.Reader
	subscriptionService    *subscription.Service
}

func NewService(
	upr ReadWriter, sr subscription.Reader, pr position.Reader, ur upload.Reader,
	ss *subscription.Service,
) *Service {
	return &Service{
		userProfileRepository:  upr,
		subscriptionRepository: sr,
		positionRepository:     pr,
		uploadRepository:       ur,
		subscriptionService:    ss,
	}
}

type GetUserMeResult struct {
	UserProfile
	Subscription     *subscription.UserSubscription `json:"subscription"` // nil if no subscription exists
	PositionsHidden  int                            `json:"positions_hidden"`
	TotalPositions   int                            `json:"total_positions"`
	UploadBytesUsed  int64                          `json:"upload_bytes_used"`
	UploadBytesLimit int64                          `json:"upload_bytes_limit"`
}

func (s *Service) GetUserMe(ctx context.Context, id uuid.UUID) (*GetUserMeResult, service.Error, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, err
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	sub, err := s.subscriptionRepository.FindUserSubscriptionByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			sub = nil // no subscription found, this is fine
		} else {
			return nil, service.ErrInternalServerError, fmt.Errorf("find user subscription by user id: %w", err)
		}
	}

	if sub != nil && sub.ShouldExpire() && !sub.IsExpired() {
		// Mark the subscription as expired.
		err = s.subscriptionService.ExpireByUserID(ctx, id)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("expire user subscription by user id: %w", err)
		}

		sub = nil
	}

	positionsExistOlderThanTwelveMonths, err := s.positionRepository.NoOfPositionsOlderThanTwelveMonths(ctx, id)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("UserHasPositionsOlderThanTwelveMonths: %w", err)
	}

	var PositionsHidden int

	if sub == nil || sub.Status != subscription.StatusActive {
		PositionsHidden = positionsExistOlderThanTwelveMonths
	}

	TotalPositions, err := s.positionRepository.TotalPositions(ctx, id)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("TotalPositions: %w", err)
	}

	TotalUploadBytesUsed, err := s.uploadRepository.GetTotalBytesUsed(ctx, id)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("upload repo get total bytes used failed: %w", err)
	}

	GetUserMeResult := &GetUserMeResult{
		*userProfile,
		sub,
		PositionsHidden,
		TotalPositions,
		TotalUploadBytesUsed,
		subscription.MaxUserUploadBytes,
	}

	return GetUserMeResult, service.ErrNone, nil
}

func (s *Service) MarkAsOnboarded(ctx context.Context, userID uuid.UUID) (service.Error, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, userID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, err
		}

		return service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	userProfile.Onboarded = true

	err = s.userProfileRepository.Update(ctx, userProfile)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to update user profile: %w", err)
	}

	return service.ErrNone, nil
}

func (s *Service) CanUpdateHomeCurrency(ctx context.Context, userID uuid.UUID) (bool, service.Error, error) {
	count, err := s.positionRepository.DistinctCurrenciesUsed(ctx, userID)
	if err != nil {
		return false, service.ErrInternalServerError, fmt.Errorf("position distinct currencies used: %w", err)
	}

	canUpdate := true
	if count > 1 {
		canUpdate = false
	}

	return canUpdate, service.ErrNone, nil
}

type UpdateHomeCurrencyPayload struct {
	NewCurrencyCode currency.CurrencyCode `json:"new_currency_code"`
}

func (s *Service) UpdateHomeCurrency(ctx context.Context, userID uuid.UUID, payload UpdateHomeCurrencyPayload) (service.Error, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, userID)
	if err != nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, err
		}

		return service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	userProfile.HomeCurrencyCode = payload.NewCurrencyCode

	err = s.userProfileRepository.Update(ctx, userProfile)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to update user profile: %w", err)
	}

	return service.ErrNone, nil
}
