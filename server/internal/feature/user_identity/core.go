package user_identity

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// NOTE: This data should **NEVER** be sent to the client except for admin access.
type UserIdentity struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Email       string     `json:"email" db:"email"`
	Verified    bool       `json:"verified" db:"verified"`
	LastLoginAt *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at" db:"updated_at"`
}

func new(email string, verified bool) (*UserIdentity, error) {
	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	userIdentity := &UserIdentity{
		ID:        ID,
		Email:     email,
		Verified:  verified,
		CreatedAt: time.Now().UTC(),
	}

	return userIdentity, nil
}
