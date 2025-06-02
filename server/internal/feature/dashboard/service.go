package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/service"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Service struct {
	dashboardRepository ReadWriter
	positionRepository  position.ReadWriter
	tradeRepository     trade.ReadWriter
}

func NewService(dashboardRepository ReadWriter, positionRepository position.ReadWriter, tradeRepository trade.ReadWriter) *Service {
	return &Service{
		dashboardRepository,
		positionRepository,
		tradeRepository,
	}
}

type getDashboardReponse struct {
	GrossPnL          decimal.Decimal `json:"gross_pnl"`
	NetPnL            decimal.Decimal `json:"net_pnl"`
	WinRatePercentage float64         `json:"win_rate_percentage"`

	CumulativePnL []CumulativePnLBucket `json:"cumulative_pnl"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, service.Error, error) {
	result, err := s.dashboardRepository.Get(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
		},
		Sort: common.Sorting{
			Field: "opened_at",
			Order: common.SortOrderASC,
		},
	}

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	for _, position := range positions {
		trades, err := s.tradeRepository.FindByPositionID(ctx, position.ID)
		if err != nil {
			return nil, service.ErrInternalServerError, err
		}
		position.Trades = trades
	}

	if len(positions) == 0 {
		return result, service.ErrNone, nil
	}

	start := positions[len(positions)-1].OpenedAt
	end := positions[0].OpenedAt
	cumulativePnL := generateCumulativePnLBuckets(positions, common.BucketPeriodMonthly, start, end)
	fmt.Println("Start", start)
	fmt.Println("End", end)
	fmt.Println("Cumulative PnL Buckets:", cumulativePnL[len(cumulativePnL)-1])

	result.CumulativePnL = cumulativePnL

	return result, service.ErrNone, nil
}
