package symbol

import (
	"arthveda/internal/feature/position"
	"arthveda/internal/service"
	"context"
	"strings"

	"github.com/google/uuid"
)

type Service struct {
	positionRepository position.ReadWriter
}

func NewService(positionRepository position.ReadWriter) *Service {
	return &Service{
		positionRepository,
	}
}

type SearchSymbolsPayload struct {
	Query string `json:"query"`
}

type SearchSymbolsResponse struct {
	Symbols []string `json:"symbols"`
}

func (s *Service) SearchSymbols(ctx context.Context, userID uuid.UUID, payload SearchSymbolsPayload) ([]string, service.Error, error) {
	query := strings.TrimSpace(payload.Query)

	symbols, err := s.positionRepository.SearchSymbols(ctx, userID, query)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	return symbols, service.ErrNone, nil
}
