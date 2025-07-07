package user_broker_account

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// UserBrokerAccount represents a user's broker account in the system.
type UserBrokerAccount struct {
	ID                   uuid.UUID   `json:"id" db:"id"`
	CreatedAt            time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt            *time.Time  `json:"updated_at" db:"updated_at"`
	Name                 string      `json:"name" db:"name"`
	BrokerID             uuid.UUID   `json:"broker_id" db:"broker_id"`
	UserID               uuid.UUID   `json:"user_id" db:"user_id"`
	OAuthClientID        *string     `json:"-" db:"oauth_client_id"`
	OAuthClientSecret    *string     `json:"-" db:"oauth_client_secret"`
	EnableAutoSync       bool        `json:"enable_auto_sync" db:"enable_auto_sync"`
	LastSyncAt           *time.Time  `json:"last_sync_at" db:"last_sync_at"`
	LastSuccessfulSyncAt *time.Time  `json:"last_successful_sync_at" db:"last_successful_sync_at"`
	LastSyncStatus       *SyncStatus `json:"last_sync_status" db:"last_sync_status"`
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
		ID:             id,
		CreatedAt:      time.Now().UTC(),
		Name:           payload.Name,
		BrokerID:       payload.BrokerID,
		UserID:         userID,
		EnableAutoSync: false,
	}, nil
}

type UpdatePayload struct {
	Name string `json:"name" validate:"required,max=63"`
}

func validateBrokerAccountName(name string) error {
	if len(name) == 0 || len(name) > 63 {
		return fmt.Errorf("Broker account name must be between 1 and 63 characters")
	}
	return nil
}
