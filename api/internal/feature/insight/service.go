package insight

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/report"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/mudgallabs/tantra/service"
	"github.com/shopspring/decimal"
)

type Service struct {
	positionRepository position.Reader
	report             *report.Service
}

func NewService(positionRepository position.Reader, report *report.Service) *Service {
	return &Service{
		positionRepository,
		report,
	}
}

type insight struct {
	Type        string           `json:"type"`
	Direction   string           `json:"direction"` // "positive" | "negative"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Tokens      map[string]token `json:"tokens"`
	Action      string           `json:"action"`
	Meta        map[string]any   `json:"meta,omitempty"`
}

type token struct {
	Value any    `json:"value"`
	Type  string `json:"type"` // "currency", "percentage", "text"
	Tone  string `json:"tone"` // "positive", "negative", "neutral"
}

type Section struct {
	Key         string    `json:"key"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Insights    []insight `json:"insights"`
}

type GetResult struct {
	Sections []Section `json:"sections"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetResult, service.Error, error) {
	searchPayload := position.GetDefaultSearchPayload(userID, enforcer, tz)

	allPositions, _, err := s.positionRepository.Search(ctx, searchPayload, true, true)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to search positions: %w", err)
	}

	baselineResult := position.GetGeneralStats(allPositions)

	timeframes, svcErr, err := s.report.GetTimeframes(ctx, userID, tz, enforcer)
	if err != nil {
		return nil, svcErr, err
	}

	timeOfDayInsights := getTimeOfDayInsights(timeframes.HourOfTheDay, baselineResult.Expectancy)

	var globalProfit decimal.Decimal
	var globalLoss decimal.Decimal

	for _, d := range timeframes.HoldingPeriod {
		if d.NetPnL.GreaterThan(decimal.Zero) {
			globalProfit = globalProfit.Add(d.NetPnL)
		} else if d.NetPnL.LessThan(decimal.Zero) {
			globalLoss = globalLoss.Add(d.NetPnL.Abs())
		}
	}

	holdingDurationInsights := getHoldingDurationInsights(
		timeframes.HoldingPeriod,
		baselineResult.Expectancy,
		globalProfit,
		globalLoss,
	)

	psychologyInsights := getPsychologyInsights(allPositions)

	return &GetResult{
		Sections: []Section{
			{
				Key:         "time_of_day",
				Title:       "Time of day",
				Description: "See how your performance changes across different hours of the day.",
				Insights:    timeOfDayInsights,
			},
			{
				Key:         "holding_duration",
				Title:       "Holding duration",
				Description: "See how long you should hold trades based on your past performance.",
				Insights:    holdingDurationInsights,
			},
			{
				Key:         "psychology",
				Title:       "Psychology",
				Description: "See how your behavior changes after wins and losses.",
				Insights:    psychologyInsights,
			},
		},
	}, service.ErrNone, nil
}
