package journal_entry_content

import "encoding/json"

type JournalEntryContent struct {
	EntryID string          `json:"entry_id" db:"entry_id"`
	Content json.RawMessage `json:"content" db:"content"`
}
