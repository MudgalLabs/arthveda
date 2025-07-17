package main

import (
	"arthveda/internal/domain/types"
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"
)

const (
	inputFile  = "instruments.csv"
	outputFile = "../../internal/domain/symbol/generated.go"
)

func main() {
	if err := generateSymbolMap(); err != nil {
		log.Fatalf("failed to generate symbol map: %v", err)
	}
}

func generateSymbolMap() error {
	// Open and parse CSV file
	symbolMap, err := parseCSV(inputFile)
	if err != nil {
		return fmt.Errorf("failed to parse CSV: %w", err)
	}

	// Write to Go file
	if err := writeGoFile(outputFile, symbolMap); err != nil {
		return fmt.Errorf("failed to write Go file: %w", err)
	}

	log.Printf("Successfully generated %d symbols to %s", len(symbolMap), outputFile)
	return nil
}

func parseCSV(filename string) (map[string]string, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)

	// Read header row
	headers, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	// Find column indexes
	colIndexes, err := findColumnIndexes(headers)
	if err != nil {
		return nil, err
	}

	// Process rows streaming to reduce memory usage
	symbolMap := make(map[string]string)
	lineNum := 1 // Header is line 1

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read CSV row %d: %w", lineNum+1, err)
		}
		lineNum++

		// Skip rows with insufficient columns
		if len(row) <= colIndexes.instrument {
			continue
		}

		// Filter for EQUITY instruments only using types.InstrumentEquity (case-insensitive)
		if strings.ToLower(strings.TrimSpace(row[colIndexes.instrument])) != strings.ToLower(string(types.InstrumentEquity)) {
			continue
		}

		token := strings.TrimSpace(row[colIndexes.token])
		symbol := strings.TrimSpace(row[colIndexes.symbol])

		// Skip empty tokens or symbols
		if token == "" || symbol == "" {
			continue
		}

		symbolMap[token] = symbol
	}

	return symbolMap, nil
}

type columnIndexes struct {
	token      int
	symbol     int
	instrument int
}

func findColumnIndexes(headers []string) (*columnIndexes, error) {
	colIndex := func(name string) int {
		for i, h := range headers {
			if strings.EqualFold(strings.TrimSpace(h), name) {
				return i
			}
		}
		return -1
	}

	indexes := &columnIndexes{
		token:      colIndex("exchange_token"),
		symbol:     colIndex("tradingsymbol"),
		instrument: colIndex("instrument_type"),
	}

	if indexes.token == -1 {
		return nil, fmt.Errorf("column 'exchange_token' not found")
	}
	if indexes.symbol == -1 {
		return nil, fmt.Errorf("column 'tradingsymbol' not found")
	}
	if indexes.instrument == -1 {
		return nil, fmt.Errorf("column 'instrument_type' not found")
	}

	return indexes, nil
}

func writeGoFile(filename string, symbolMap map[string]string) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer file.Close()

	writer := bufio.NewWriter(file)
	defer writer.Flush()

	// Write package declaration and map start
	if _, err := writer.WriteString("package symbol\n\n"); err != nil {
		return err
	}
	if _, err := writer.WriteString("var symbolByCode = map[string]string{\n"); err != nil {
		return err
	}

	// Sort keys for deterministic output
	keys := make([]int, 0, len(symbolMap))
	for k := range symbolMap {
		kInt, err := strconv.Atoi(k)
		if err != nil {
			// Skip invalid integer keys
			continue
		}
		keys = append(keys, kInt)
	}
	sort.Ints(keys)

	// Write map entries
	for _, key := range keys {
		keyStr := strconv.Itoa(key)
		value := symbolMap[keyStr]
		// Escape quotes in key and value
		escapedKey := strings.ReplaceAll(keyStr, `"`, `\"`)
		escapedValue := strings.ReplaceAll(value, `"`, `\"`)
		if _, err := fmt.Fprintf(writer, "\t\"%s\": \"%s\",\n", escapedKey, escapedValue); err != nil {
			return err
		}
	}

	// Write map end
	if _, err := writer.WriteString("}\n"); err != nil {
		return err
	}

	return nil
}
