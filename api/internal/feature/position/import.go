package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type importFileMetadata struct {
	// The row index of the header.
	headerRowIdx int

	// The symbol column index.
	symbolColumnIdx int

	// The scrip code column index.
	// Scrip code is also known as exchange token.
	// This is only used for Upstox.
	scripCodeIdx int

	// The segment column index.
	segmentColumnIdx int

	// The trade type column index. Buy or Sell.
	tradeTypeColumnIdx int

	// The quantity column index.
	quantityColumnIdx int

	// The price column index.
	priceColumnIdx int

	// The exchange order ID column index.
	orderIDColumnIdx int

	// The execution timestamp column index.
	dateTimeColumnIdx int

	// The time column index.
	timeColumnIdx int

	// The date column index.
	dateColumnIdx int
}

type parseRowResult struct {
	symbol     string
	instrument Instrument
	tradeKind  trade.Kind
	quantity   decimal.Decimal
	price      decimal.Decimal
	orderID    string
	time       time.Time
}

type Importer interface {
	getMetadata(rows [][]string) (*importFileMetadata, error)
	parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error)
}

type ZerodhaImporter struct{}

func (i ZerodhaImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, dateTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {
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
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order Execution Time") {
				dateTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (i ZerodhaImporter) parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateTimeColumnIdx := metadata.dateTimeColumnIdx

	symbol := row[symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]
	timeStr := row[dateTimeColumnIdx]

	tradeKind := trade.Kind(tradeTypeStr)
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity in row: %s", quantityStr)
	}

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price in row: %s", priceStr)
	}

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeTime, err := time.ParseInLocation("2006-01-02T15:04:05", timeStr, ist)
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
		orderID:    orderID,
		time:       tradeTime,
	}, nil
}

type GrowwImporter struct{}

func (i *GrowwImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, dateTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Symbol") {
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Exchange Order Id") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Execution date and time") {
				headerRowIdx = rowIdx
				dateTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (i *GrowwImporter) parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateTimeColumnIdx := metadata.dateTimeColumnIdx

	symbol := row[symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	// Parse trade details from the row
	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]
	timeStr := row[dateTimeColumnIdx]

	tradeKind := trade.Kind(strings.ToLower(tradeTypeStr))
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price at row : %s", priceStr)
	}
	// Groww provides the price as total price for the trade,
	// meaning for the given quantity, the price is the total amount paid.
	price = price.Div(decimal.NewFromFloat(quantity))

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeTime, err := time.ParseInLocation("02-01-2006 03:04 PM", timeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time at row : %s", timeStr)
	}

	instrument := InstrumentEquity

	return &parseRowResult{
		symbol:     symbol,
		instrument: instrument,
		tradeKind:  tradeKind,
		quantity:   decimal.NewFromFloat(quantity),
		price:      price,
		orderID:    orderID,
		time:       tradeTime,
	}, nil
}

type UpstoxImporter struct{}

func (i *UpstoxImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, scripCodeColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, timeColumnIdx, dateColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Company") {
				// If we found "Symbol" in the header, we can assume this is the header row.
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Scrip Code") {
				scripCodeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Side") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Num") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Time") {
				timeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Date") {
				dateColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		scripCodeIdx:       scripCodeColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateColumnIdx:      dateColumnIdx,
		timeColumnIdx:      timeColumnIdx,
	}, nil
}

func (i *UpstoxImporter) parseRow(row []string, metadata *importFileMetadata) (*parseRowResult, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	scripCodeColumnIdx := metadata.scripCodeIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateColumnIdx := metadata.dateColumnIdx
	timeColumnIdx := metadata.timeColumnIdx

	symbolStr := row[symbolColumnIdx]
	if symbolStr == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	// In Upstox, the symbol is actually the company name, so we need to use teh "exchange_token" to get the actual symbol.
	scripCode := row[scripCodeColumnIdx]

	if scripCode != "" {
		// If we have a scrip code, we will use it to get the actual symbol.
		symbol, exists := symbol.GetSymbolFromCode(scripCode)

		// If we do have a symbol, we will use it.
		if exists {
			symbolStr = symbol
		}
	}

	// We can use the scrip code to get the actual symbol from the exchange.

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	// Parse trade details from the row
	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]

	tradeKind := trade.Kind(strings.ToLower(tradeTypeStr))
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	// Check if the price string starts with the rupee symbol and strip it
	if after, ok := strings.CutPrefix(priceStr, "₹"); ok {
		priceStr = after
		priceStr = strings.TrimSpace(priceStr)
	}

	// Remove ₹ and commas
	priceStr = strings.ReplaceAll(priceStr, "₹", "")
	priceStr = strings.ReplaceAll(priceStr, ",", "")

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price at row : %s", priceStr)
	}

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	dateStr := row[dateColumnIdx]
	timeStr := row[timeColumnIdx]

	// Combine date and time strings
	dateTimeStr := dateStr + " " + timeStr
	tradeTime, err := time.ParseInLocation("02-01-2006 15:04:05", dateTimeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid datetime at row : %s", dateTimeStr)
	}

	instrument := InstrumentEquity

	// We will create our own order ID based on the first 3 characters of the order ID and the date.
	// We need date because using just the first 3 characters of the order ID can lead to collisions.
	// Adding date ensure that there are no collisions, unless my assumption about the first 3 characters is wrong.
	// Upstox does not provide a unique order ID for each trade, but they have a pattern to identify
	// which trades belong to the same order.
	// The first 3 characters of the order ID are the same for all trades that belong to the same order.
	// So we will create a custom order ID by combining the first 3 characters of the order ID with the trade's date.
	// Create a custom order ID by combining the first 3 characters of the order ID with the date.
	// NOTE: Well, I found a collision when using only prefix + date, so I added the symbol as well.
	orderIDPrefix := orderID[:3]
	dateStr = tradeTime.Format("20060102")
	orderID = orderIDPrefix + dateStr + symbolStr

	return &parseRowResult{
		symbol:     symbolStr,
		instrument: instrument,
		tradeKind:  tradeKind,
		quantity:   decimal.NewFromFloat(quantity),
		price:      price,
		orderID:    orderID,
		time:       tradeTime,
	}, nil
}

// getImporter returns an importer for the given broker.
func getImporer(b *broker.Broker) (Importer, error) {
	switch b.Name {
	case broker.BrokerNameZerodha:
		return &ZerodhaImporter{}, nil
	case broker.BrokerNameGroww:
		return &GrowwImporter{}, nil
	case broker.BrokerNameUpstox:
		return &UpstoxImporter{}, nil
	default:
		return nil, fmt.Errorf("unsupported broker: %s", b.Name)
	}
}
