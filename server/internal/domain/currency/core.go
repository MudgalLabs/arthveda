package currency

import (
	"encoding/json"
	"fmt"
	"strings"
)

// There is no database for Currency right now, that's why this is in Domain.

// CurrencyCode is an ISO 4217 currency code (e.g., "inr", "usd")
type CurrencyCode string

const (
	CurrencyINR CurrencyCode = "inr"
	// Add more as needed
)

type supportedCurrency struct {
	Code   CurrencyCode `json:"code"`
	Name   string       `json:"name"`
	Symbol string       `json:"symbol"`
}

// supportedCurrencies holds the list of currencies supported by Arthveda.
var supportedCurrencies = []supportedCurrency{
	{Code: CurrencyINR, Name: "Indian Rupee", Symbol: "₹"},
}

func ParseCurrencyCode(code string) (CurrencyCode, error) {
	code = strings.ToLower(code)
	cc := CurrencyCode(code)
	if !cc.IsValid() {
		return "", fmt.Errorf("invalid currency code: %s", code)
	}
	return cc, nil
}

// IsValid checks if the currency is supported
func (c CurrencyCode) IsValid() bool {
	for _, currency := range supportedCurrencies {
		if c == currency.Code {
			return true
		}
	}
	return false
}

// UnmarshalJSON ensures only valid currency codes are accepted
func (c *CurrencyCode) UnmarshalJSON(data []byte) error {
	var code string
	if err := json.Unmarshal(data, &code); err != nil {
		return err
	}
	code = strings.ToLower(code)
	cc := CurrencyCode(code)
	if !cc.IsValid() {
		return fmt.Errorf("invalid currency code: %s", code)
	}
	*c = cc
	return nil
}

// MarshalJSON ensures proper casing (lowercase)
func (c CurrencyCode) MarshalJSON() ([]byte, error) {
	return json.Marshal(strings.ToLower(string(c)))
}

// String returns the lowercase string representation
func (c CurrencyCode) String() string {
	return string(c)
}
