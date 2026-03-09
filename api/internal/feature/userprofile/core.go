// Package userprofile defines the UserProfile struct and its methods.
package userprofile

import (
	"arthveda/internal/feature/currency"
	"time"

	"github.com/google/uuid"
)

type UserProfile struct {
	UserID           uuid.UUID             `json:"user_id" db:"user_id"`
	Email            string                `json:"email" db:"email"`
	Name             string                `json:"name" db:"name"`
	AvatarURL        string                `json:"avatar_url" db:"avatar_url"`
	HomeCurrencyCode currency.CurrencyCode `json:"home_currency_code" db:"home_currency_code"`
	Onboarded        bool                  `json:"onboarded" db:"onboarded"`
	CreatedAt        time.Time             `json:"created_at" db:"created_at"`
	UpdatedAt        *time.Time            `json:"updated_at" db:"updated_at"`
}

func NewUserProfile(userID uuid.UUID, email, name string) *UserProfile {
	return &UserProfile{
		UserID:           userID,
		Email:            email,
		Name:             name,
		HomeCurrencyCode: "INR",
		Onboarded:        false,
		CreatedAt:        time.Now().UTC(),
	}
}
