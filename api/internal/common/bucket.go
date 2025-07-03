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

// Label returns a human-readable label for the bucket based on its period and timezone.
func (b Bucket) Label(loc *time.Location) string {
	localStart := b.Start.In(loc)

	switch b.Period {
	case BucketPeriodDaily:
		return localStart.Format("02 Jan 2006")
	case BucketPeriodWeekly:
		localEnd := b.End.In(loc).AddDate(0, 0, -1)
		return fmt.Sprintf("%s - %s", localStart.Format("02 Jan"), localEnd.Format("02 Jan"))
	case BucketPeriodMonthly:
		return localStart.Format("Jan 2006")
	default:
		return localStart.Format("02 Jan")
	}
}

// GenerateBuckets creates non-overlapping time ranges (buckets) based on the specified period:
// - daily: 1-day buckets
// - weekly: 7-day buckets (starting from `start`)
// - monthly: calendar month buckets
func GenerateBuckets(period BucketPeriod, start, end time.Time, loc *time.Location) []Bucket {
	buckets := []Bucket{}

	// Normalize to midnight in user's timezone
	userStart := time.Date(start.In(loc).Year(), start.In(loc).Month(), start.In(loc).Day(), 0, 0, 0, 0, loc)
	userEnd := time.Date(end.In(loc).Year(), end.In(loc).Month(), end.In(loc).Day(), 0, 0, 0, 0, loc)

	var rangeStart, rangeEnd time.Time
	switch period {
	case BucketPeriodMonthly:
		rangeStart = time.Date(userStart.Year(), userStart.Month(), 1, 0, 0, 0, 0, loc)
		rangeEnd = time.Date(userEnd.Year(), userEnd.Month(), 1, 0, 0, 0, 0, loc)
	default:
		rangeStart = userStart
		rangeEnd = userEnd
	}

	for current := rangeStart; current.Before(rangeEnd); {
		var next time.Time
		switch period {
		case BucketPeriodDaily:
			next = current.AddDate(0, 0, 1)
		case BucketPeriodWeekly:
			next = current.AddDate(0, 0, 7)
		case BucketPeriodMonthly:
			next = current.AddDate(0, 1, 0)
		}

		bucketStart := current
		bucketEnd := next

		if bucketEnd.After(userEnd) {
			bucketEnd = userEnd
		}

		if bucketStart.Before(bucketEnd) {
			buckets = append(buckets, Bucket{
				Start:  bucketStart.UTC(),
				End:    bucketEnd.UTC(),
				Period: period,
			})
		}

		current = next
	}

	return buckets
}
