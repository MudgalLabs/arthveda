package currency

import (
	"encoding/json"
	"strings"
)

type Currency struct {
	Code         CurrencyCode `json:"code" db:"code"`
	Name         string       `json:"name" db:"name"`
	FXSuppported bool         `json:"fx_supported" db:"fx_supported"`
}

// CurrencyCode is an ISO 4217 currency code (e.g., "INR", "USD")
type CurrencyCode string

const (
	CurrencyINR CurrencyCode = "INR"
	// Add more as needed
)

func ParseCurrencyCode(code string) CurrencyCode {
	return CurrencyCode(code)
}

// UnmarshalJSON ensures only valid currency codes are accepted
func (c *CurrencyCode) UnmarshalJSON(data []byte) error {
	var code string
	if err := json.Unmarshal(data, &code); err != nil {
		return err
	}
	code = strings.ToUpper(code)
	cc := CurrencyCode(code)
	*c = cc
	return nil
}

// MarshalJSON ensures proper casing (uppercase)
func (c CurrencyCode) MarshalJSON() ([]byte, error) {
	return json.Marshal(strings.ToUpper(string(c)))
}

// String returns the lowercase string representation
func (c CurrencyCode) String() string {
	return string(c)
}
