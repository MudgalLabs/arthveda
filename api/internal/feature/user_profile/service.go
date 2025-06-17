package user_profile

import (
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	userProfileRepository ReadWriter
}

func NewService(upr ReadWriter) *Service {
	return &Service{
		userProfileRepository: upr,
	}
}

type GetUserMeResult struct {
	UserProfile
}

func (s *Service) GetUserMe(ctx context.Context, id uuid.UUID) (*GetUserMeResult, service.Error, error) {
	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, id)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, err
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	GetUserMeResult := &GetUserMeResult{
		*userProfile,
	}

	return GetUserMeResult, service.ErrNone, nil
}
