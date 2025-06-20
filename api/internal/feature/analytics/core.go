package analytics

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Analytics struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	Email          string     `json:"email" db:"email"`
	DemoStartCount int        `json:"demo_start_count" db:"demo_start_count"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at" db:"updated_at"`
}

func New(email string) (*Analytics, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	return &Analytics{
		ID:             id,
		Email:          email,
		DemoStartCount: 0,
		CreatedAt:      time.Now().UTC(),
	}, nil
}
