package common

import (
	"fmt"
	"strings"
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

// "14_15" -> "2–3 PM"
func FormatHour(hour Hour) string {
	var h1, h2 int
	fmt.Sscanf(string(hour), "%02d_%02d", &h1, &h2)

	format := func(h int) (int, string) {
		if h == 0 {
			return 12, "AM"
		}
		if h < 12 {
			return h, "AM"
		}
		if h == 12 {
			return 12, "PM"
		}
		return h - 12, "PM"
	}

	fh1, p1 := format(h1)
	fh2, _ := format(h2)

	return fmt.Sprintf("%d–%d %s", fh1, fh2, p1)
}

func FormatHourRange(start, end Hour) string {
	var s1, s2, e1, e2 int

	fmt.Sscanf(string(start), "%02d_%02d", &s1, &s2)
	fmt.Sscanf(string(end), "%02d_%02d", &e1, &e2)

	format := func(h int) (int, string) {
		if h == 0 {
			return 12, "AM"
		}
		if h < 12 {
			return h, "AM"
		}
		if h == 12 {
			return 12, "PM"
		}
		return h - 12, "PM"
	}

	fs, ps := format(s1)
	fe, pe := format(e2)

	// Same period (AM-AM or PM-PM).
	if ps == pe {
		return fmt.Sprintf("%d–%d %s", fs, fe, ps)
	}

	// Cross period (rare but correct).
	return fmt.Sprintf("%d %s – %d %s", fs, ps, fe, pe)
}

type HoldingPeriod string

const (
	HoldingUnder1m  HoldingPeriod = "under_1m"
	Holding1To5m    HoldingPeriod = "1_5m"
	Holding5To15m   HoldingPeriod = "5_15m"
	Holding15To60m  HoldingPeriod = "15_60m"
	Holding1To24h   HoldingPeriod = "1_24h"
	Holding1To7d    HoldingPeriod = "1_7d"
	Holding7To30d   HoldingPeriod = "7_30d"
	Holding30To365d HoldingPeriod = "30_365d"
	HoldingOver365d HoldingPeriod = "over_365d"
)

func GetHoldingPeriodBucket(d time.Duration) HoldingPeriod {
	switch {
	case d < time.Minute:
		return HoldingUnder1m
	case d < 5*time.Minute:
		return Holding1To5m
	case d < 15*time.Minute:
		return Holding5To15m
	case d < time.Hour:
		return Holding15To60m
	case d < 24*time.Hour:
		return Holding1To24h
	case d < 7*24*time.Hour:
		return Holding1To7d
	case d < 30*24*time.Hour:
		return Holding7To30d
	case d < 365*24*time.Hour:
		return Holding30To365d
	default:
		return HoldingOver365d
	}
}

func FormatHoldingPeriod(p HoldingPeriod) string {
	switch p {
	case HoldingUnder1m:
		return "under 1 min"
	case Holding1To5m:
		return "1–5 min"
	case Holding5To15m:
		return "5–15 min"
	case Holding15To60m:
		return "15–60 min"
	case Holding1To24h:
		return "1–24 hours"
	case Holding1To7d:
		return "1–7 days"
	case Holding7To30d:
		return "7–30 days"
	case Holding30To365d:
		return "1–12 months"
	case HoldingOver365d:
		return "over 1 year"
	default:
		return string(p) // safe fallback
	}
}

func FormatHoldingPeriodRange(start, end HoldingPeriod) string {
	s := holdingMetaMap[start]
	e := holdingMetaMap[end]

	// Case 1: same bucket → fallback to single label
	if start == end {
		return s.label
	}

	// Case 2: open-ended (start = under_1m, wide range)
	if s.min == 0 && e.max != 0 {
		return "less than " + formatHoldingDuration(e.max)
	}

	// Case 3: open-ended (end = over_365d)
	if e.max == 0 {
		return "more than " + formatHoldingDuration(s.min)
	}

	// Case 4: normal range
	return fmt.Sprintf("%s to %s",
		formatHoldingDuration(s.min),
		formatHoldingDuration(e.max),
	)
}

type holdingMeta struct {
	min   time.Duration // inclusive
	max   time.Duration // exclusive (0 = infinity)
	label string        // clean label
}

var holdingMetaMap = map[HoldingPeriod]holdingMeta{
	HoldingUnder1m:  {0, time.Minute, "less than 1 minute"},
	Holding1To5m:    {time.Minute, 5 * time.Minute, "1–5 minutes"},
	Holding5To15m:   {5 * time.Minute, 15 * time.Minute, "5–15 minutes"},
	Holding15To60m:  {15 * time.Minute, time.Hour, "15–60 minutes"},
	Holding1To24h:   {time.Hour, 24 * time.Hour, "1–24 hours"},
	Holding1To7d:    {24 * time.Hour, 7 * 24 * time.Hour, "1–7 days"},
	Holding7To30d:   {7 * 24 * time.Hour, 30 * 24 * time.Hour, "7–30 days"},
	Holding30To365d: {30 * 24 * time.Hour, 365 * 24 * time.Hour, "30–365 days"},
	HoldingOver365d: {365 * 24 * time.Hour, 0, "more than 1 year"},
}

func formatHoldingDuration(d time.Duration) string {
	days := int(d.Hours() / 24)

	switch {
	case d < time.Hour:
		mins := int(d.Minutes())
		return plural(mins, "min")

	case d < 24*time.Hour:
		hours := int(d.Hours())
		return plural(hours, "hour")

	case days < 30:
		return plural(days, "day")

	case days < 365:
		months := days / 30
		return plural(months, "month")

	default:
		years := days / 365
		return plural(years, "year")
	}
}

type HoldingCategory string

const (
	HoldingScalping HoldingCategory = "scalping"
	HoldingIntraday HoldingCategory = "intraday"
	HoldingSwing    HoldingCategory = "swing"
	HoldingPosition HoldingCategory = "position"
)

func GetHoldingCategory(p HoldingPeriod) HoldingCategory {
	switch p {
	case HoldingUnder1m, Holding1To5m:
		return HoldingScalping

	case Holding5To15m, Holding15To60m, Holding1To24h:
		return HoldingIntraday

	case Holding1To7d, Holding7To30d:
		return HoldingSwing

	case Holding30To365d, HoldingOver365d:
		return HoldingPosition

	default:
		return HoldingIntraday
	}
}

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

func FormatDuration(start time.Time, end *time.Time) string {
	if end == nil {
		return "-"
	}

	d := end.Sub(start)

	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	mins := int(d.Minutes()) % 60

	var parts []string

	if days > 0 {
		parts = append(parts, fmt.Sprintf("%d days", days))
	}

	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%d hours", hours))
	}

	parts = append(parts, fmt.Sprintf("%d mins", mins))

	return strings.Join(parts, " ")
}
