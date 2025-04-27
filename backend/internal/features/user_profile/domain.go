package user_profile

import (
	"time"

	"github.com/guregu/null/v6/zero"
)

type UserProfile struct {
	UserID       int64     `json:"user_id" db:"user_id"`
	Email        string    `json:"email" db:"email"`
	DisplayName  string    `json:"display_name" db:"display_name"`
	DisplayImage string    `json:"display_image" db:"display_image"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    zero.Time `json:"updated_at" db:"updated_at"`
}

func NewUserProfile(userID int64, email string) *UserProfile {
	return &UserProfile{
		UserID:    userID,
		Email:     email,
		CreatedAt: time.Now().UTC(),
	}
}
