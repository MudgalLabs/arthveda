package symbol

func GetSymbolFromCode(code string) (string, bool) {
	if symbol, exists := symbolByCode[code]; exists {
		return symbol, true
	} else {
		return "", false
	}
}
