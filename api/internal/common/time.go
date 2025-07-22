package common

import (
	"time"
)

type Exchange string

const (
	ExchangeNSE Exchange = "nse"
	ExchangeBSE Exchange = "bse"
	// add more as needed
)

type ExchangeTZ string

const AsiaKolkataTZ ExchangeTZ = "Asia/Kolkata"

var exchangeTZByExchange = map[Exchange]ExchangeTZ{
	ExchangeNSE: AsiaKolkataTZ,
	ExchangeBSE: AsiaKolkataTZ,
	// add more as needed
}

func GetTimeZoneForExchange(exchange Exchange) (ExchangeTZ, bool) {
	tz, exists := exchangeTZByExchange[exchange]
	return tz, exists
}

// NormalizeDateRangeFromTimezone takes a from/to date (assumed to be in UTC),
// and a timezone like "Asia/Kolkata", and returns [from, to) in UTC,
// representing full days in the user's local timezone.
// This is useful for date range filters where we want to snap to the start of the day in the user's timezone.
func NormalizeDateRangeFromTimezone(from, to time.Time, loc *time.Location) (time.Time, time.Time, error) {
	var fromLocal, toLocal time.Time

	if !from.IsZero() {
		// Snap to midnight in user's local timezone
		fromLocal = time.Date(from.In(loc).Year(), from.In(loc).Month(), from.In(loc).Day(), 0, 0, 0, 0, loc)
	} else {
		fromLocal = from
	}

	if !to.IsZero() {
		// Snap to midnight of the day after 'to' in user's local timezone
		toLocal = time.Date(to.In(loc).Year(), to.In(loc).Month(), to.In(loc).Day(), 0, 0, 0, 0, loc).Add(24 * time.Hour)
	} else {
		toLocal = to
	}

	return fromLocal.UTC(), toLocal.UTC(), nil
}
