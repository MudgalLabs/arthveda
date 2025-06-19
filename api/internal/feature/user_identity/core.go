package user_identity

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// NOTE: This data should **NEVER** be sent to the client except for admin access.
type UserIdentity struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	Email         string     `json:"email" db:"email"`
	PasswordHash  string     `json:"password_hash" db:"password_hash"`
	Verified      bool       `json:"verified" db:"verified"`
	OAuthProvider string     `json:"oauth_provider" db:"oauth_provider"`
	LastLoginAt   *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at" db:"updated_at"`
}

func new(email, password, oauthProvider string, verified bool) (*UserIdentity, error) {
	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	var passwordHash string

	if password != "" {
		if oauthProvider != "" {
			return nil, fmt.Errorf("cannot set both password and OAuth provider")
		}

		// TODO: I read we can add "Salt" too to passwords? Look into that.Add commentMore actions
		// NOTE: Cost 10 is good enough? I tried 12 and that takes like 200ms.
		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}

		passwordHash = string(passwordHashBytes)
	}

	userIdentity := &UserIdentity{
		ID:            ID,
		Email:         email,
		PasswordHash:  passwordHash,
		Verified:      verified,
		OAuthProvider: oauthProvider,
		CreatedAt:     time.Now().UTC(),
	}

	return userIdentity, nil
}

// successfulSignin updates the user when they successfully sign in.
func (ui *UserIdentity) successfulSignin() {
	now := time.Now().UTC()
	ui.LastLoginAt = &now
}
