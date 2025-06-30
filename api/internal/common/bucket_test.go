package common

import (
	"testing"
	"time"
)

// helper to parse date
func mustDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}

func TestGenerateBuckets_Monthly(t *testing.T) {
	start := mustDate("2024-01-15") // intentionally mid-month
	end := mustDate("2024-12-31")

	buckets := GenerateBuckets(BucketPeriodMonthly, start, end)

	expectedMonths := 12
	if len(buckets) != expectedMonths {
		t.Fatalf("expected %d monthly buckets, got %d", expectedMonths, len(buckets))
	}

	for i, bucket := range buckets {
		expectedStart := time.Date(2024, time.Month(i+1), 1, 0, 0, 0, 0, time.UTC)
		expectedEnd := expectedStart.AddDate(0, 1, 0)

		if !bucket.Start.Equal(expectedStart) {
			t.Errorf("bucket %d: expected start %v, got %v", i, expectedStart, bucket.Start)
		}

		if !bucket.End.Equal(expectedEnd) && !(i == len(buckets)-1 && bucket.End.Before(expectedEnd)) {
			t.Errorf("bucket %d: expected end %v, got %v", i, expectedEnd, bucket.End)
		}

		// Check for overlaps/gaps
		if i > 0 && !buckets[i-1].End.Equal(bucket.Start) {
			t.Errorf("bucket %d: buckets are not continuous (prev.End = %v, curr.Start = %v)", i, buckets[i-1].End, bucket.Start)
		}
	}
}

func TestGenerateBuckets_Daily(t *testing.T) {
	start := mustDate("2024-05-01")
	end := mustDate("2024-05-05")

	buckets := GenerateBuckets(BucketPeriodDaily, start, end)
	expected := 4 // 1st to 2nd, 2nd to 3rd, 3rd to 4th, 4th to 5th

	if len(buckets) != expected {
		t.Fatalf("expected %d daily buckets, got %d", expected, len(buckets))
	}

	for i, b := range buckets {
		expectedStart := start.AddDate(0, 0, i)
		expectedEnd := expectedStart.AddDate(0, 0, 1)
		if !b.Start.Equal(expectedStart) {
			t.Errorf("bucket %d: expected start %v, got %v", i, expectedStart, b.Start)
		}
		if !b.End.Equal(expectedEnd) {
			t.Errorf("bucket %d: expected end %v, got %v", i, expectedEnd, b.End)
		}
	}
}

func TestGenerateBuckets_Weekly(t *testing.T) {
	start := mustDate("2024-05-01")
	end := mustDate("2024-05-29")

	buckets := GenerateBuckets(BucketPeriodWeekly, start, end)
	expected := 4 // weeks: 1–8, 8–15, 15–22, 22–29

	if len(buckets) != expected {
		t.Fatalf("expected %d weekly buckets, got %d", expected, len(buckets))
	}

	for i, b := range buckets {
		expectedStart := start.AddDate(0, 0, i*7)
		expectedEnd := expectedStart.AddDate(0, 0, 7)
		if i == len(buckets)-1 && expectedEnd.After(end) {
			expectedEnd = end
		}
		if !b.Start.Equal(expectedStart) {
			t.Errorf("bucket %d: expected start %v, got %v", i, expectedStart, b.Start)
		}
		if !b.End.Equal(expectedEnd) {
			t.Errorf("bucket %d: expected end %v, got %v", i, expectedEnd, b.End)
		}
	}
}

func TestGenerateBuckets_Monthly_DecemberEdgeCase(t *testing.T) {
	start := mustDate("2024-12-01")
	end := mustDate("2024-12-31")

	buckets := GenerateBuckets(BucketPeriodMonthly, start, end)

	if len(buckets) != 1 {
		t.Fatalf("expected 1 bucket for December, got %d", len(buckets))
	}

	got := buckets[0]

	expectedStart := mustDate("2024-12-01")
	expectedEnd := mustDate("2025-01-01") // should roll over to Jan cleanly

	if !got.Start.Equal(expectedStart) {
		t.Errorf("expected start %v, got %v", expectedStart, got.Start)
	}
	if !got.End.Equal(expectedEnd) {
		t.Errorf("expected end %v, got %v", expectedEnd, got.End)
	}
}
