package analytics

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/tag"
	"arthveda/internal/logger"
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

type tagsSummaryGroup struct {
	TagGroup string            `json:"tag_group"`
	Tags     []tagsSummaryItem `json:"tags"`
}

type cumulativePnLByTag struct {
	TagGroup string               `json:"tag_group"`
	TagName  string               `json:"tag_name"`
	Buckets  []position.PnlBucket `json:"buckets"`
}

type cumulativePnLByTagGroup struct {
	TagGroup string               `json:"tag_group"`
	Tags     []cumulativePnLByTag `json:"tags"`
}

type GetTabsResult struct {
	Summary                 []tagsSummaryItem         `json:"summary"`
	SummaryGroup            []tagsSummaryGroup        `json:"summary_group"`
	CumulativePnLByTagGroup []cumulativePnLByTagGroup `json:"cumulative_pnl_by_tag_group"`
}

func (s *Service) GetTags(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetTabsResult, service.Error, error) {
	l := logger.Get()
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

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, true, true)
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

	// Prepare: tagID -> positions
	tagIDToPositions := make(map[string][]*position.Position)
	for _, pos := range positions {
		for _, tagObj := range pos.Tags {
			tagID := tagObj.ID.String()
			tagIDToPositions[tagID] = append(tagIDToPositions[tagID], pos)
		}
	}

	// For each tag, compute cumulative PnL buckets
	cumulativePnLByTagGroupData := []cumulativePnLByTagGroup{}

	for _, tg := range tagGroupsWithTags {
		group := cumulativePnLByTagGroup{
			TagGroup: tg.TagGroup.Name,
			Tags:     []cumulativePnLByTag{},
		}

		for _, t := range tg.Tags {
			tagID := t.ID.String()
			tagPositions := tagIDToPositions[tagID]
			if len(tagPositions) == 0 {
				fmt.Printf("Tag '%s' has no positions\n", t.Name)
				continue
			}

			rangeStart, rangeEnd := position.GetRangeBasedOnTrades(tagPositions)
			fmt.Printf("Tag '%s': rangeStart=%v, rangeEnd=%v, positions=%d\n", t.Name, rangeStart, rangeEnd, len(tagPositions))

			// Fallback: If rangeStart or rangeEnd is zero, use global positions' range
			if rangeStart.IsZero() || rangeEnd.IsZero() || !rangeEnd.After(rangeStart) {
				fmt.Printf("Tag '%s': Invalid range, skipping or fallback\n", t.Name)
				// Optionally, fallback to global range if you want to always show something:
				// rangeStart, rangeEnd = position.GetRangeBasedOnTrades(positions)
				continue
			}

			bucketPeriod := common.GetBucketPeriodForRange(rangeStart, rangeEnd)

			positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

			for _, pos := range positionsFiltered {
				_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
				if err != nil {
					l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
					continue
				}
			}

			cumulative := position.GetCumulativePnLBuckets(tagPositions, bucketPeriod, rangeStart, rangeEnd, tz)

			group.Tags = append(group.Tags, cumulativePnLByTag{
				TagGroup: tg.TagGroup.Name,
				TagName:  t.Name,
				Buckets:  cumulative,
			})
		}
		if len(group.Tags) > 0 {
			cumulativePnLByTagGroupData = append(cumulativePnLByTagGroupData, group)
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

	// Group summary by TagGroup for bar chart
	groupMap := make(map[string][]tagsSummaryItem)
	for _, item := range summary {
		groupMap[item.TagGroup] = append(groupMap[item.TagGroup], item)
	}

	var summaryGroup []tagsSummaryGroup
	for group, items := range groupMap {
		// Sort tags within group by NetPnL desc
		sort.Slice(items, func(i, j int) bool {
			return items[i].NetPnL.GreaterThan(items[j].NetPnL)
		})
		summaryGroup = append(summaryGroup, tagsSummaryGroup{
			TagGroup: group,
			Tags:     items,
		})
	}

	// Sort groups by name
	sort.Slice(summaryGroup, func(i, j int) bool {
		return summaryGroup[i].TagGroup < summaryGroup[j].TagGroup
	})

	return &GetTabsResult{
		Summary:                 summary,
		SummaryGroup:            summaryGroup,
		CumulativePnLByTagGroup: cumulativePnLByTagGroupData,
	}, service.ErrNone, nil
}
