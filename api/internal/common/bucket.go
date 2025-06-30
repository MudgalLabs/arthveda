package common

import (
	"fmt"
	"time"
)

type BucketPeriod string

const (
	BucketPeriodDaily   BucketPeriod = "daily"
	BucketPeriodWeekly  BucketPeriod = "weekly"
	BucketPeriodMonthly BucketPeriod = "monthly"
)

type Bucket struct {
	Start  time.Time
	End    time.Time
	Period BucketPeriod
}

// Label returns a human-readable label for the bucket based on its period.
func (b Bucket) Label() string {
	switch b.Period {
	case BucketPeriodDaily:
		return b.Start.Format("02 Jan 2006") // 31 May 2025
	case BucketPeriodWeekly:
		return fmt.Sprintf("%s - %s",
			b.Start.Format("02 Jan"),
			b.End.AddDate(0, 0, -1).Format("02 Jan"), // 31 May - 06 Jun
		)
	case BucketPeriodMonthly:
		return b.Start.Format("Jan 2006") // May 2025
	default:
		return b.Start.Format("02 Jan")
	}
}

// GenerateBuckets creates non-overlapping time ranges (buckets) based on the specified period:
// - daily: 1-day buckets
// - weekly: 7-day buckets (starting from `start`)
// - monthly: calendar month buckets
func GenerateBuckets(period BucketPeriod, start, end time.Time) []Bucket {
	buckets := []Bucket{}

	// Normalize to midnight UTC or local, depending on input
	start = start.Truncate(24 * time.Hour)
	end = end.Truncate(24 * time.Hour)

	// For monthly, align start to first of month and end to first of next month
	if period == BucketPeriodMonthly {
		start = time.Date(start.Year(), start.Month(), 1, 0, 0, 0, 0, start.Location())
		end = time.Date(end.Year(), end.Month(), 1, 0, 0, 0, 0, end.Location()).AddDate(0, 1, 0)
	} else {
		end = end.AddDate(0, 0, 1) // include the final day
	}

	current := start

	for current.Before(end) {
		var next time.Time

		switch period {
		case BucketPeriodDaily:
			next = current.AddDate(0, 0, 1)
		case BucketPeriodWeekly:
			next = current.AddDate(0, 0, 7)
		case BucketPeriodMonthly:
			next = current.AddDate(0, 1, 0)
		default:
			next = current.AddDate(0, 0, 1)
		}

		bucketEnd := next
		if bucketEnd.After(end) {
			bucketEnd = end
		}

		// Only add bucket if it has a valid time range
		if bucketEnd.After(current) {
			buckets = append(buckets, Bucket{
				Start:  current,
				End:    bucketEnd,
				Period: period,
			})
		}

		current = next
	}

	return buckets
}
