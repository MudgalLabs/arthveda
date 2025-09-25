package journal_entry

import (
	"arthveda/internal/feature/journal_entry_content"
	"arthveda/internal/repository"
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	journalEntryRepository        ReadWriter
	journalEntryContentRepository journal_entry_content.ReadWriter
}

func NewService(
	journalEntryRepository ReadWriter,
	journalEntryContentRepository journal_entry_content.ReadWriter,
) *Service {
	return &Service{
		journalEntryRepository:        journalEntryRepository,
		journalEntryContentRepository: journalEntryContentRepository,
	}
}

func (s *Service) UpsertForPosition(ctx context.Context, userID, positionID uuid.UUID, content json.RawMessage) (*JournalEntry, error) {
	journalEntry, err := s.journalEntryRepository.UpsertForPosition(ctx, userID, positionID)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert journal entry for position: %w", err)
	}

	_, err = s.journalEntryContentRepository.Upsert(ctx, journalEntry.ID, content)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert journal entry content: %w", err)
	}

	return journalEntry, nil
}

func (s *Service) GetJournalContentForPosition(ctx context.Context, userID, positionID uuid.UUID) (*json.RawMessage, error) {
	journalEntry, err := s.journalEntryRepository.GetForPosition(ctx, userID, positionID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, nil
		} else {
			return nil, fmt.Errorf("failed to get journal entry for position: %w", err)
		}
	}

	journalEntryContent, err := s.journalEntryContentRepository.GetByJournalEntryID(ctx, journalEntry.ID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, nil
		} else {
			return nil, fmt.Errorf("failed to get journal entry content: %w", err)
		}
	}

	return &journalEntryContent.Content, nil
}
