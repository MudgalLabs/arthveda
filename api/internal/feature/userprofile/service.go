package userprofile

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	userProfileRepository  ReadWriter
	subscriptionRepository subscription.Reader
}

func NewService(upr ReadWriter, sr subscription.Reader) *Service {
	return &Service{
		userProfileRepository:  upr,
		subscriptionRepository: sr,
	}
}

type GetUserMeResult struct {
	UserProfile
	Subscription *subscription.UserSubscription `json:"subscription"` // nil if no subscription exists
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

	GetUserMeResult := &GetUserMeResult{
		*userProfile,
		userSubscription,
	}

	return GetUserMeResult, service.ErrNone, nil
}
