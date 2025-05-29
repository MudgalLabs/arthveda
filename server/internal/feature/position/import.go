package position

import (
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type importFileMetadata struct {
	// Data provided starts at this time.
	from time.Time

	// Data provided ends at this time.
	to time.Time

	// The row index of the header.
	headerRowIdx int

	// The symbol column index.
	symbolColumnIdx int

	// The segment column index.
	segmentColumnIdx int

	// The trade type column index. Buy or Sell.
	tradeTypeColumnIdx int

	// The quantity column index.
	quantityColumnIdx int

	// The price column index.
	priceColumnIdx int

	// The exchange order ID column index.
	orderIdColumnIdx int

	// The execution time column index.
	timeColumnIdx int
}

type parseRowResult struct {
	symbol     string
	instrument Instrument
	tradeKind  trade.Kind
	quantity   decimal.Decimal
	price      decimal.Decimal
	orderId    string
	time       time.Time
}

type BrokerImporter interface {
	getMetadata(rows [][]string) (*importFileMetadata, error)
	parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error)
}

type ZerodhaImporter struct {
}

func (i ZerodhaImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	if len(rows) == 0 {
		return nil, fmt.Errorf("Excel file is empty")
	}

	var dateRangeStr string
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIdColumnIdx, timeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {
			if strings.Contains(colCell, "Tradebook") {
				dateRangeStr = colCell
			}

			if strings.Contains(colCell, "Symbol") {
				// If we found "Symbol" in the header, we can assume this is the header row.
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order ID") {
				orderIdColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order Execution Time") {
				timeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	if dateRangeStr == "" {
		return nil, fmt.Errorf("Unable to find date range data in the file")
	}

	// Define regex to extract two dates in YYYY-MM-DD format from the `dateRangeStr`.
	// Example: "Tradebook for Equity from 2025-01-01 to 2025-03-31"
	re := regexp.MustCompile(`from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})`)
	matches := re.FindStringSubmatch(dateRangeStr)

	if len(matches) != 3 {
		return nil, fmt.Errorf("Unable to extract date range from tradebook string")
	}

	fromStr := matches[1]
	toStr := matches[2]

	layout := "2006-01-02"

	fromDate, err := time.Parse(layout, fromStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid from date format")
	}

	toDate, err := time.Parse(layout, toStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid to date format")
	}

	return &importFileMetadata{
		from:               fromDate,
		to:                 toDate,
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIdColumnIdx:   orderIdColumnIdx,
		timeColumnIdx:      timeColumnIdx,
	}, nil
}

func (i ZerodhaImporter) parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIdColumnIdx := metadata.orderIdColumnIdx
	timeColumnIdx := metadata.timeColumnIdx

	symbol := row[symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIdColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]
	timeStr := row[timeColumnIdx]

	tradeKind := trade.Kind(tradeTypeStr)
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity in row: %s", quantityStr)
	}

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price in row: %s", priceStr)
	}

	tradeTime, err := time.Parse("2006-01-02T15:04:05", timeStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid time in row: %s", timeStr)
	}

	var instrument Instrument
	if segment == "EQ" {
		instrument = InstrumentEquity
	}

	return &parseRowResult{
		symbol:     symbol,
		instrument: instrument,
		tradeKind:  tradeKind,
		quantity:   decimal.NewFromFloat(quantity),
		price:      price,
		orderId:    orderID,
		time:       tradeTime,
	}, nil
}

type GrowwImporter struct {
}

func (i *GrowwImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	return &importFileMetadata{}, nil
}

func (i *GrowwImporter) parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error) {
	return &parseRowResult{}, nil
}

// getImporter returns an importer for the given broker.
func getBrokerImporter(b *broker.Broker) (BrokerImporter, error) {
	switch b.Name {
	case broker.BrokerNameZerodha:
		return &ZerodhaImporter{}, nil
	case broker.BrokerNameGroww:
		return &GrowwImporter{}, nil
	default:
		return nil, fmt.Errorf("unsupported broker: %s", b.Name)
	}
}
