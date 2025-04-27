package user_profile

import (
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"
)

type Service struct {
	userProfileRepository ReadWriter
}

func NewService(upr ReadWriter) *Service {
	return &Service{
		userProfileRepository: upr,
	}
}

func (s *Service) GetUserProfile(ctx context.Context, id int64) (*UserProfile, service.ErrKind, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, err
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	return userProfile, service.ErrNone, nil
}
