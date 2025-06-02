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
			b.End.AddDate(0, 0, -1).Format("02 Jan"),
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

	// Normalize time (truncate to midnight UTC)
	start = start.Truncate(24 * time.Hour)
	end = end.Truncate(24 * time.Hour)

	// Adjust start and end for monthly buckets
	if period == BucketPeriodMonthly {
		start = time.Date(start.Year(), start.Month(), 1, 0, 0, 0, 0, start.Location())
		end = time.Date(end.Year(), end.Month(), 1, 0, 0, 0, 0, end.Location()).AddDate(0, 1, -1)
	}

	current := start

	for current.Before(end) || current.Equal(end) {
		var next time.Time

		switch period {
		case BucketPeriodDaily:
			// Move one day forward
			next = current.AddDate(0, 0, 1)
		case BucketPeriodWeekly:
			// Move one week forward
			next = current.AddDate(0, 0, 7)
		case BucketPeriodMonthly:
			// Move to first day of next month
			next = current.AddDate(0, 1, 0)
		default:
			// Fallback to daily
			next = current.AddDate(0, 0, 1)
		}

		// Prevent bucket end from going past 'end'
		bucketEnd := next
		if bucketEnd.After(end) {
			bucketEnd = end
		}

		buckets = append(buckets, Bucket{
			Start:  current,
			End:    bucketEnd,
			Period: period,
		})

		current = next
	}

	return buckets
}
