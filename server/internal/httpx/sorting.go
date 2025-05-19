package httpx

import (
	"fmt"
	"slices"
	"strings"
)

type SortOrder = string

const (
	SortOrderASC  = "asc"
	SortOrderDESC = "desc"
)

type Sorting struct {
	Field string    `query:"field" json:"field"` // e.g., "created_at"
	Order SortOrder `query:"order" json:"order"`
}

func (s *Sorting) Validate(allowed []string) error {
	field := strings.ToLower(s.Field)
	order := strings.ToLower(s.Order)

	if field == "" {
		return nil // No sorting applied — that's OK
	}

	// Check if field is in allowed list
	valid := slices.Contains(allowed, field)

	if !valid {
		return fmt.Errorf("invalid sort field: %s", s.Field)
	}

	// Validate sort order
	if order != "" && order != "asc" && order != "desc" {
		return fmt.Errorf("invalid sor order: %s", s.Order)
	}

	s.Field = field
	s.Order = order

	return nil
}
