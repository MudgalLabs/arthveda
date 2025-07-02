package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"
)

func main() {
	// Open CSV
	f, err := os.Open("instruments.csv")
	if err != nil {
		log.Fatalf("failed to open csv: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	records, err := r.ReadAll()
	if err != nil {
		log.Fatalf("failed to read csv: %v", err)
	}

	// Find header indexes
	headers := records[0]
	colIndex := func(name string) int {
		for i, h := range headers {
			if strings.EqualFold(h, name) {
				return i
			}
		}
		log.Fatalf("column %s not found", name)
		return -1
	}

	idxToken := colIndex("exchange_token")
	idxSymbol := colIndex("tradingsymbol")
	idxInstrument := colIndex("instrument_type")

	// Build map
	symbolMap := map[string]string{}
	for _, row := range records[1:] {
		if len(row) <= idxInstrument {
			continue
		}
		if strings.ToUpper(row[idxInstrument]) != "EQUITY" {
			continue
		}
		token := row[idxToken]
		symbol := row[idxSymbol]
		symbolMap[token] = symbol
	}

	// Write to Go file
	out, err := os.Create("../../internal/domain/symbol/generated.go")
	if err != nil {
		log.Fatalf("failed to create output file: %v", err)
	}
	defer out.Close()

	fmt.Fprintln(out, "package symbol\n")
	fmt.Fprintln(out, "var symbolByCode = map[string]string{")
	for k, v := range symbolMap {
		fmt.Fprintf(out, "\t\"%s\": \"%s\",\n", k, v)
	}
	fmt.Fprintln(out, "}")
}
