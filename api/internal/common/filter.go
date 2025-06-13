package common

import "time"

type DateRangeFilter struct {
	From *time.Time `json:"from"`
	To   *time.Time `json:"to"`
}
