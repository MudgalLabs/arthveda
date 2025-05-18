package httpx

import (
	"fmt"
	"strings"
)

type SortOrder = string

const (
	SortOrderASC  = "ASC"
	SortOrderDESC = "DESC"
)

type Sorting struct {
	SortBy    string    `query:"sort_by" json:"sort_by"`       // e.g., "opened_at"
	SortOrder SortOrder `query:"sort_order" json:"sort_order"` // "ASC" or "DESC"
}

func (s *Sorting) Validate(allowedColumns []string) error {
	sortBy := strings.ToLower(s.SortBy)
	sortOrder := strings.ToLower(s.SortOrder)

	if sortBy == "" {
		return nil // No sorting applied — that's OK
	}

	// Check if SortBy is in allowed list
	valid := false
	for _, col := range allowedColumns {
		if col == sortBy {
			valid = true
			break
		}
	}

	if !valid {
		return fmt.Errorf("invalid sort_by value: %s", s.SortBy)
	}

	// Validate sort order
	if sortOrder != "" && sortOrder != "asc" && sortOrder != "desc" {
		return fmt.Errorf("invalid sort_order value: %s", s.SortOrder)
	}

	s.SortBy = sortBy
	s.SortOrder = sortOrder

	return nil
}
