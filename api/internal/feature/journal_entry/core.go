package journal_entry

import (
	"time"

	"github.com/google/uuid"
)

type JournalEntryScope string

const (
	JournalEntryScopePosition JournalEntryScope = "position"
)

type JournalEntry struct {
	ID         uuid.UUID         `json:"id" db:"id"`
	UserID     uuid.UUID         `json:"user_id" db:"user_id"`
	Scope      JournalEntryScope `json:"scope" db:"scope"`
	PositionID *uuid.UUID        `json:"position_id" db:"position_id"`
	CreatedAt  time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time        `json:"updated_at" db:"updated_at"`
}
