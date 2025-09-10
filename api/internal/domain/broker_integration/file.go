package broker_integration

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type importFileMetadata struct {
	// The row index of the header.
	HeaderRowIdx int

	// The symbol column index.
	symbolColumnIdx int

	// The scrip code column index.
	// Scrip code is also known as exchange token.
	//
	// [Upstox]
	scripCodeIdx int

	// The segment column index.
	segmentColumnIdx int

	// The instrument type column index.
	//
	// [Upstox] to figure out if the symbol is Future or Option("European Call" or "European Put").
	instrumentTypeColumnIdx int

	// The expiry type column index.
	// This is used when we are importing futures or options. This helps us build a "symbol" for the trade.
	expiryTypeColumnIdx int

	// The strike price column index for options.
	strikePriceColumnIdx int

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

	// The buy price column index.
	// [Angel One] provides separate columns for buy and sell price.
	buyPriceColumnIdx  int
	sellPriceColumnIdx int
}

type FileAdapter interface {
	GetMetadata(rows [][]string) (*importFileMetadata, error)
	ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error)
}

// GetFileAdapter returns an importer for the given broker.
func GetFileAdapter(b *broker.Broker) (FileAdapter, error) {
	switch b.Name {
	case broker.BrokerNameAngelOne:
		return &angelOneFileAdapter{}, nil
	case broker.BrokerNameGroww:
		return &growwFileAdapter{}, nil
	case broker.BrokerNameUpstox:
		return &upstoxFileAdapter{}, nil
	case broker.BrokerNameZerodha:
		return &zerodhaFileAdapter{}, nil
	default:
		return nil, fmt.Errorf("unsupported broker: %s", b.Name)
	}
}

type angelOneFileAdapter struct{}

func (adapter *angelOneFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, buyPriceColumnIdx,
		sellPriceColumnIdx, orderIDColumnIdx, dateTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Scrip/Contract") {
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Buy/Sell") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Buy Price") {
				buyPriceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Sell Price") {
				sellPriceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order ID") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Date") {
				dateTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		HeaderRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		buyPriceColumnIdx:  buyPriceColumnIdx,
		sellPriceColumnIdx: sellPriceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (adapter *angelOneFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
	symbol := row[metadata.symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[metadata.segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[metadata.orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	tradeTypeStr := row[metadata.tradeTypeColumnIdx]
	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))

	quantityStr := row[metadata.quantityColumnIdx]
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	var price decimal.Decimal
	switch tradeKind {
	case types.TradeKindBuy:
		buyPriceStr := row[metadata.buyPriceColumnIdx]
		price, err = decimal.NewFromString(buyPriceStr)
		if err != nil {
			return nil, fmt.Errorf("Invalid buy price at row : %s", buyPriceStr)
		}
	case types.TradeKindSell:
		sellPriceStr := row[metadata.sellPriceColumnIdx]
		price, err = decimal.NewFromString(sellPriceStr)
		if err != nil {
			return nil, fmt.Errorf("Invalid sell price at row : %s", sellPriceStr)
		}
	default:
		return nil, fmt.Errorf("Invalid trade kind at row : %s", tradeTypeStr)
	}

	timeStr := row[metadata.dateTimeColumnIdx]

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeTime, err := time.ParseInLocation("1/2/06 15:04", timeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time at row : %s", timeStr)
	}

	// For now, we will assume that all trades are equity trades.
	instrument := types.InstrumentEquity

	shouldIgnore := false

	if quantity == 0 {
		shouldIgnore = true
	}

	if segment != "CAPITAL" {
		shouldIgnore = true
	}

	return &types.ImportableTrade{
		Symbol:       symbol,
		Instrument:   instrument,
		TradeKind:    tradeKind,
		Quantity:     decimal.NewFromFloat(quantity),
		Price:        price,
		OrderID:      orderID,
		Time:         tradeTime,
		ShouldIgnore: shouldIgnore,
	}, nil
}

type growwFileAdapter struct{}

func (adapter *growwFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
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
		HeaderRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (adapter *growwFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
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

	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))
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

	instrument := types.InstrumentEquity

	return &types.ImportableTrade{
		Symbol:     symbol,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}

type upstoxFileAdapter struct{}

func (adapter *upstoxFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, scripCodeColumnIdx, segmentColumnIdx, instrumentTypeColumnIdx, expiryTypeColumnIdx, strikePriceColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, timeColumnIdx, dateColumnIdx int

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

			if strings.Contains(colCell, "Instrument Type") {
				instrumentTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Expiry") {
				expiryTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Strike Price") {
				strikePriceColumnIdx = columnIdx
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
		HeaderRowIdx:            headerRowIdx,
		symbolColumnIdx:         symbolColumnIdx,
		scripCodeIdx:            scripCodeColumnIdx,
		segmentColumnIdx:        segmentColumnIdx,
		instrumentTypeColumnIdx: instrumentTypeColumnIdx,
		strikePriceColumnIdx:    strikePriceColumnIdx,
		expiryTypeColumnIdx:     expiryTypeColumnIdx,
		tradeTypeColumnIdx:      tradeTypeColumnIdx,
		quantityColumnIdx:       quantityColumnIdx,
		priceColumnIdx:          priceColumnIdx,
		orderIDColumnIdx:        orderIDColumnIdx,
		dateColumnIdx:           dateColumnIdx,
		timeColumnIdx:           timeColumnIdx,
	}, nil
}

func (adapter *upstoxFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	scripCodeColumnIdx := metadata.scripCodeIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	instrumentTypeColumnIdx := metadata.instrumentTypeColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateColumnIdx := metadata.dateColumnIdx
	timeColumnIdx := metadata.timeColumnIdx

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	var instrumentTypeStr string
	var instrument types.Instrument
	switch segment {
	case "EQ":
		instrument = types.InstrumentEquity
	case "FO", "COM":
		instrumentTypeStr = row[instrumentTypeColumnIdx]
		if segment == "" {
			return nil, fmt.Errorf("Instrument Type is empty in row")
		}

		if instrumentTypeStr == "European Call" || instrumentTypeStr == "European Put" {
			instrument = types.InstrumentOption
		} else {
			instrument = types.InstrumentFuture
		}
	default:
		return nil, fmt.Errorf("Segment %s is invalid in row", segment)
	}

	var expiryStr string
	if instrument == types.InstrumentOption || instrument == types.InstrumentFuture {
		expiryStr = row[metadata.expiryTypeColumnIdx]
		if expiryStr == "" {
			return nil, fmt.Errorf("Expiry is empty in row")
		}

		// Parse the expiry date from the expiry string.
		// The expiry string is in the format "dd-mm-yyyy".
		expiryDate, err := time.Parse("02-01-2006", expiryStr)
		if err != nil {
			return nil, fmt.Errorf("Invalid expiry date in row: %s", expiryStr)
		}

		// Convert "31-10-2024" to "31OCT" format.
		expiryStr = expiryDate.Format("02JAN")
	}

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

	// TODO: Handle Future as well.
	switch instrument {
	case types.InstrumentOption:
		var strikePriceStr string
		if instrument == types.InstrumentOption {
			strikePriceStr = row[metadata.strikePriceColumnIdx]
			if strikePriceStr == "" {
				return nil, fmt.Errorf("Strike Price is empty in row")
			}
		}

		var callOptionStr string
		if instrumentTypeStr == "European Call" {
			callOptionStr = "CE"
		}
		if instrumentTypeStr == "European Put" {
			callOptionStr = "PE"
		}

		symbolStr = symbolStr + expiryStr + strikePriceStr + callOptionStr
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	// Parse trade details from the row
	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]

	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))
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

	return &types.ImportableTrade{
		Symbol:     symbolStr,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}

type zerodhaFileAdapter struct{}

func (adapter zerodhaFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
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
		HeaderRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (adapter zerodhaFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
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

	tradeKind := types.TradeKind(tradeTypeStr)
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

	var instrument types.Instrument
	switch segment {
	case "EQ":
		instrument = types.InstrumentEquity
	case "FO", "COM":
		// FO is Futures and Options, COM is Commodities.

		// CE = Call Option, PE = Put Option & FUT = Future.
		// Example of Options - NIFTY24DEC25000CE, NIFTY25JAN23500PE
		// Example of Futures -  NATURALGAS25MAYFUT.
		if strings.HasSuffix(symbol, "CE") || strings.HasSuffix(symbol, "PE") {
			instrument = types.InstrumentOption
		} else if strings.HasSuffix(symbol, "FUT") {
			instrument = types.InstrumentFuture
		}
	}

	return &types.ImportableTrade{
		Symbol:     symbol,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}
