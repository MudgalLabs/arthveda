package userprofile

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
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
}

func NewService(upr ReadWriter, sr subscription.Reader, pr position.Reader) *Service {
	return &Service{
		userProfileRepository:  upr,
		subscriptionRepository: sr,
		positionRepository:     pr,
	}
}

type GetUserMeResult struct {
	UserProfile
	Subscription    *subscription.UserSubscription `json:"subscription"` // nil if no subscription exists
	PositionsHidden int                            `json:"positions_hidden"`
	TotalPositions  int                            `json:"total_positions"`
}

func (s *Service) GetUserMe(ctx context.Context, id uuid.UUID) (*GetUserMeResult, service.Error, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, err
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	userSubscription, err := s.subscriptionRepository.FindUserSubscriptionByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			userSubscription = nil // no subscription found, this is fine
		} else {
			return nil, service.ErrInternalServerError, fmt.Errorf("find user subscription by user id: %w", err)
		}
	}

	positionsExistOlderThanTwelveMonths, err := s.positionRepository.NoOfPositionsOlderThanTwelveMonths(ctx, id)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("UserHasPositionsOlderThanTwelveMonths: %w", err)
	}

	var PositionsHidden int

	if userSubscription == nil || userSubscription.Status != subscription.StatusActive {
		PositionsHidden = positionsExistOlderThanTwelveMonths
	}

	TotalPositions, err := s.positionRepository.TotalPositions(ctx, id)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("TotalPositions: %w", err)
	}

	GetUserMeResult := &GetUserMeResult{
		*userProfile,
		userSubscription,
		PositionsHidden,
		TotalPositions,
	}

	return GetUserMeResult, service.ErrNone, nil
}
