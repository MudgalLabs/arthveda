package userbrokeraccount

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// UserBrokerAccount represents a user's broker account in the system.
type UserBrokerAccount struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at" db:"updated_at"`
	Name          string     `json:"name" db:"name"`
	BrokerID      uuid.UUID  `json:"broker_id" db:"broker_id"`
	UserID        uuid.UUID  `json:"user_id" db:"user_id"`
	OAuthClientID *string    `json:"-" db:"oauth_client_id"`
	LastSyncAt    *time.Time `json:"last_sync_at" db:"last_sync_at"`
	LastLoginAt   *time.Time `json:"last_login_at" db:"last_login_at"`

	OAuthClientSecretBytes []byte `json:"-" db:"oauth_client_secret_bytes"`
	OAuthClientSecretNonce []byte `json:"-" db:"oauth_client_secret_nonce"`
	AccessTokenBytes       []byte `json:"-" db:"access_token_bytes"`
	AccessTokenBytesNonce  []byte `json:"-" db:"access_token_bytes_nonce"`

	//
	// Runtime fields
	//

	// If we have a OAuthClientID and OAuthClientSecret, we are considered connected.
	IsConnected bool `json:"is_connected"`

	// if we have an access token, we are considered authenticated.
	IsAuthenticated bool `json:"is_authenticated"`
}

type SyncStatus string

const (
	SyncStatusSuccess SyncStatus = "success"
	SyncStatusFailure SyncStatus = "failure"
)

type CreatePayload struct {
	Name     string    `json:"name"`
	BrokerID uuid.UUID `json:"broker_id"`
}

func new(userID uuid.UUID, payload CreatePayload) (*UserBrokerAccount, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("generate new UUID: %w", err)
	}
	return &UserBrokerAccount{
		ID:        id,
		CreatedAt: time.Now().UTC(),
		Name:      payload.Name,
		BrokerID:  payload.BrokerID,
		UserID:    userID,
	}, nil
}

type UpdatePayload struct {
	Name              string `json:"name" validate:"required,max=63"`
	OAuthClientID     string `json:"oauth_client_id"`
	OAuthClientSecret string `json:"oauth_client_secret"`
}

type ConnectPayload struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

func validateBrokerAccountName(name string) error {
	if len(name) == 0 || len(name) > 63 {
		return fmt.Errorf("Broker account name must be between 1 and 63 characters")
	}
	return nil
}
