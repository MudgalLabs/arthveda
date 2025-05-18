package user_identity

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// NOTE: This data should **NEVER** be sent to the client except for admin access.
type UserIdentity struct {
	ID                  uuid.UUID  `json:"id" db:"id"`
	Email               string     `json:"email" db:"email"`
	PasswordHash        string     `json:"password_hash" db:"password_hash"`
	Verified            bool       `json:"verified" db:"verified"`
	FailedLoginAttempts int        `json:"failed_login_attempts" db:"failed_login_attempts"`
	LastLoginAt         *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           *time.Time `json:"updated_at" db:"updated_at"`
}

func newUserIdentity(email, password string) (*UserIdentity, error) {
	// TODO: I read we can add "Salt" too to passwords? Look into that.
	// NOTE: Cost 10 is good enough? I tried 12 and that takes like 200ms.
	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	userIdentity := &UserIdentity{
		ID:                  ID,
		Email:               email,
		PasswordHash:        string(passwordHashBytes),
		Verified:            false,
		FailedLoginAttempts: 0,
		CreatedAt:           time.Now().UTC(),
	}

	return userIdentity, nil
}
