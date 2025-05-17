package user_profile

import (
	"time"

	"github.com/google/uuid"
	"github.com/guregu/null/v6/zero"
)

type UserProfile struct {
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Email        string    `json:"email" db:"email"`
	DisplayName  string    `json:"display_name" db:"display_name"`
	DisplayImage string    `json:"display_image" db:"display_image"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    zero.Time `json:"updated_at" db:"updated_at"`
}

func NewUserProfile(userID uuid.UUID, email, name string) *UserProfile {
	return &UserProfile{
		UserID:      userID,
		Email:       email,
		DisplayName: name,
		CreatedAt:   time.Now().UTC(),
	}
}
