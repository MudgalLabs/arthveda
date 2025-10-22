package analytics

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/tag"
	"fmt"

	"context"
	"time"

	"sort"

	"github.com/google/uuid"
	"github.com/mudgallabs/tantra/service"
	"github.com/shopspring/decimal"
)

type Service struct {
	positionRepository position.ReadWriter
	tagRepository      tag.ReadWriter
}

func NewService(positionRepository position.ReadWriter, tagRepository tag.ReadWriter) *Service {
	return &Service{
		positionRepository: positionRepository,
		tagRepository:      tagRepository,
	}
}

type tagsSummaryItem struct {
	TagGroup       string          `json:"tag_group"`
	TagName        string          `json:"tag_name"`
	GrossPnL       decimal.Decimal `json:"gross_pnl"`
	NetPnL         decimal.Decimal `json:"net_pnl"`
	Charges        decimal.Decimal `json:"charges"`
	PositionsCount int             `json:"positions_count"`
	RFactor        decimal.Decimal `json:"r_factor"`
}

type GetTabsResult struct {
	Summary []tagsSummaryItem `json:"summary"`
}

func (s *Service) GetTags(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetTabsResult, service.Error, error) {
	yearAgo := time.Now().In(tz).AddDate(-1, 0, 0)
	tradeTimeRange := &common.DateRangeFilter{}

	if !enforcer.CanAccessAllPositions() {
		tradeTimeRange.From = &yearAgo
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
			TradeTime: tradeTimeRange,
		},
		Sort: common.Sorting{
			Field: "opened_at",
			Order: common.SortOrderASC,
		},
	}

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, false, true)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to search positions: %w", err)
	}

	tagGroupsWithTags, err := s.tagRepository.ListTagGroupsWithTags(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to list tag groups with tags: %w", err)
	}

	// Build tagID -> (groupName, tagName) map
	type tagMeta struct {
		GroupName string
		TagName   string
	}
	tagIDToMeta := make(map[string]tagMeta)
	for _, tg := range tagGroupsWithTags {
		for _, t := range tg.Tags {
			tagIDToMeta[t.ID.String()] = tagMeta{
				GroupName: tg.TagGroup.Name,
				TagName:   t.Name,
			}
		}
	}

	// Aggregate analytics by tag group and tag name.
	type tagKey struct {
		Group string
		Name  string
	}

	summaryMap := make(map[tagKey]*tagsSummaryItem)

	for _, pos := range positions {
		for _, tagObj := range pos.Tags {
			meta, ok := tagIDToMeta[tagObj.ID.String()]
			if !ok {
				continue // Skip tags not found in user's tag groups.
			}

			key := tagKey{Group: meta.GroupName, Name: meta.TagName}
			item, exists := summaryMap[key]
			if !exists {
				item = &tagsSummaryItem{
					TagGroup:       meta.GroupName,
					TagName:        meta.TagName,
					GrossPnL:       decimal.Zero,
					NetPnL:         decimal.Zero,
					Charges:        decimal.Zero,
					PositionsCount: 0,
					RFactor:        decimal.Zero,
				}
				summaryMap[key] = item
			}

			item.GrossPnL = item.GrossPnL.Add(pos.GrossPnLAmount)
			item.NetPnL = item.NetPnL.Add(pos.NetPnLAmount)
			item.Charges = item.Charges.Add(pos.TotalChargesAmount)
			item.RFactor = item.RFactor.Add(pos.RFactor)
			item.PositionsCount += 1
		}
	}

	// Convert map to slice and sort by group_name, net_pnl desc.
	var summary []tagsSummaryItem
	for _, item := range summaryMap {
		summary = append(summary, *item)
	}

	sort.Slice(summary, func(i, j int) bool {
		if summary[i].TagGroup == summary[j].TagGroup {
			return summary[i].NetPnL.GreaterThan(summary[j].NetPnL)
		}
		return summary[i].TagGroup < summary[j].TagGroup
	})

	return &GetTabsResult{Summary: summary}, service.ErrNone, nil
}
