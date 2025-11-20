package symbol

import (
	"arthveda/internal/domain/types"
	"strings"
)

func GetSymbolFromCode(code string) (string, bool) {
	if symbol, exists := symbolByCode[code]; exists {
		return symbol, true
	} else {
		return "", false
	}
}

func Sanitize(symbol string, instrument types.Instrument) string {
	santizedSymbol := strings.ToUpper(symbol)

	if instrument == types.InstrumentEquity {
		for i, c := range santizedSymbol {
			if c == '-' {
				return santizedSymbol[:i]
			}
		}
	}

	return santizedSymbol
}
