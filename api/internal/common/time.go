package common

import (
	"time"
)

type Day string

const (
	DayMon Day = "mon"
	DayTue Day = "tue"
	DayWed Day = "wed"
	DayThu Day = "thu"
	DayFri Day = "fri"
	DaySat Day = "sat"
	DaySun Day = "sun"
)

type Hour string

const (
	Hour00_01 Hour = "00_01"
	Hour01_02 Hour = "01_02"
	Hour02_03 Hour = "02_03"
	Hour03_04 Hour = "03_04"
	Hour04_05 Hour = "04_05"
	Hour05_06 Hour = "05_06"
	Hour06_07 Hour = "06_07"
	Hour07_08 Hour = "07_08"
	Hour08_09 Hour = "08_09"
	Hour09_10 Hour = "09_10"
	Hour10_11 Hour = "10_11"
	Hour11_12 Hour = "11_12"
	Hour12_13 Hour = "12_13"
	Hour13_14 Hour = "13_14"
	Hour14_15 Hour = "14_15"
	Hour15_16 Hour = "15_16"
	Hour16_17 Hour = "16_17"
	Hour17_18 Hour = "17_18"
	Hour18_19 Hour = "18_19"
	Hour19_20 Hour = "19_20"
	Hour20_21 Hour = "20_21"
	Hour21_22 Hour = "21_22"
	Hour22_23 Hour = "22_23"
	Hour23_24 Hour = "23_24"
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

func IsSameDay(t1, t2 time.Time, loc *time.Location) bool {
	t1InLoc := t1.In(loc)
	t2InLoc := t2.In(loc)

	return t1InLoc.Year() == t2InLoc.Year() &&
		t1InLoc.Month() == t2InLoc.Month() &&
		t1InLoc.Day() == t2InLoc.Day()
}
