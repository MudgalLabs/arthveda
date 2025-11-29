package broker_integration

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"fmt"
	"regexp"
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

	// The exchange column index.
	// This is used to figure out the exchange the trade was executed on.
	//
	// [Kotak Securities] we will use this column values to figure out
	// the Instrument this trade belongs to.
	exchangeColumnIdx int

	// The order execution time column index.
	//
	// [Kotak Securities] we will use this column to form our own "OrderID"
	// that will allow us to aggregate trades that belong to the same order.
	orderExecutionTimeColumnIdx int
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
	case broker.BrokerNameFyers:
		return &fyersFileAdapter{}, nil
	case broker.BrokerNameGroww:
		return &growwFileAdapter{}, nil
	case broker.BrokerNameKotakSecurities:
		return &kotakSecuritiesFileAdapter{}, nil
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

	tradeDateTime, err := time.ParseInLocation("1/2/06 15:04", timeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time at row : %s", timeStr)
	}

	shouldIgnore := false

	if quantity == 0 {
		shouldIgnore = true
	}

	if segment != "CAPITAL" && segment != "FUTURES" {
		shouldIgnore = true
	}

	// For now, we will assume that all trades are equity trades.
	var instrument types.Instrument

	switch segment {
	case "CAPITAL":
		instrument = types.InstrumentEquity
	case "FUTURES":
		if strings.Contains(symbol, "OPT") && (strings.Contains(symbol, "CE") || strings.Contains(symbol, "PE")) {
			instrument = types.InstrumentOption
		} else if strings.Contains(symbol, "FUT") {
			instrument = types.InstrumentFuture
		} else {
			shouldIgnore = true
		}
	default:
		shouldIgnore = true
	}

	switch instrument {
	case types.InstrumentOption:
		fields := strings.Fields(symbol)

		underlying := fields[1]                    // e.g. "NIFTY"
		month := strings.ToUpper(fields[2][:3])    // "Oct" -> "OCT"
		day := fmt.Sprintf("%02s", fields[3])      // "1" -> "01"
		strike := strings.Split(fields[5], ".")[0] // "24900.00" -> "24900"
		optionType := fields[6]                    // "CE" or "PE"

		// We need to format `symbol` to a standard symbol name we use in Arthveda.
		// Example - NIFTY31JUL24900CE
		symbol = fmt.Sprintf("%s%s%s%s%s", underlying, day, month, strike, optionType)

	case types.InstrumentFuture:
		fields := strings.Fields(symbol)

		underlying := fields[1]              // e.g. "NIFTY"
		expiry := strings.ToUpper(fields[2]) // "20OCT25"
		symbol = fmt.Sprintf("%s%sFUT", underlying, expiry)
	}

	return &types.ImportableTrade{
		Symbol:       symbol,
		Instrument:   instrument,
		TradeKind:    tradeKind,
		Quantity:     decimal.NewFromFloat(quantity),
		Price:        price,
		OrderID:      orderID,
		Time:         tradeDateTime,
		ShouldIgnore: shouldIgnore,
	}, nil
}

type fyersFileAdapter struct{}

func (adapter *fyersFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, dateColumnIdx, timeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "symbol") {
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "qty") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "trade_price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "date") {
				dateColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "time") {
				timeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "order_id") {
				orderIDColumnIdx = columnIdx
				headerRowIdx = rowIdx
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
		dateColumnIdx:      dateColumnIdx,
		timeColumnIdx:      timeColumnIdx,
	}, nil
}

func (adapter *fyersFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateColumnIdx := metadata.dateColumnIdx
	timeColumnIdx := metadata.timeColumnIdx

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

	dateTimeStr := dateStr + " " + timeStr

	tradeTime, err := time.ParseInLocation("02/01/2006 03:04 PM", dateTimeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid datetime at row: %s (err: %v)", dateTimeStr, err)
	}

	symbolStr := row[symbolColumnIdx]
	if symbolStr == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	var shouldIgnore bool
	var instrument types.Instrument
	var symbol string

	if segment == "BSE_FNO" || segment == "NSE_FNO" {
		instrument = types.InstrumentOption

		// Parse option symbol: e.g. "IO PE SENSEX 27Nov2025 84300"
		fields := strings.Fields(symbolStr)

		if len(fields) == 5 {
			// fields[2]: underlying, fields[3]: expiry (27Nov2025), fields[4]: strike, fields[1]: option type (PE/CE)
			underlying := fields[2]
			expiryRaw := fields[3] // e.g. 27Nov2025
			strike := fields[4]
			optionType := strings.ToUpper(fields[1]) // PE or CE

			// Parse expiry to DDMMM (ignore year)
			expiryDay := ""
			expiryMonth := ""
			if len(expiryRaw) >= 5 {
				expiryDay = expiryRaw[:2]
				expiryMonth = strings.ToUpper(expiryRaw[2:5])
			}
			expiry := expiryDay + expiryMonth

			symbol = fmt.Sprintf("%s%s%s%s", underlying, expiry, strike, optionType)
		} else {
			// fallback to original symbol if parsing fails
			symbol = symbolStr
		}
	} else {
		shouldIgnore = true
		symbol = symbolStr
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

			// Groww's old format had "Price", new format has "Value".
			if strings.Contains(colCell, "Price") || strings.Contains(colCell, "Value") {
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

type kotakSecuritiesFileAdapter struct{}

func (adapter *kotakSecuritiesFileAdapter) GetMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, exchangeColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx,
		orderIDColumnIdx, dateColumnIdx, timeColumnIdx, orderExecutationTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Security Name") {
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Exchange") {
				exchangeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Transaction Type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Market Rate") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order ID") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Date") {
				dateColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Time") {
				timeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order Time") {
				orderExecutationTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		HeaderRowIdx:                headerRowIdx,
		symbolColumnIdx:             symbolColumnIdx,
		exchangeColumnIdx:           exchangeColumnIdx,
		tradeTypeColumnIdx:          tradeTypeColumnIdx,
		quantityColumnIdx:           quantityColumnIdx,
		priceColumnIdx:              priceColumnIdx,
		orderIDColumnIdx:            orderIDColumnIdx,
		dateColumnIdx:               dateColumnIdx,
		timeColumnIdx:               timeColumnIdx,
		orderExecutionTimeColumnIdx: orderExecutationTimeColumnIdx,
	}, nil
}

func (adapter *kotakSecuritiesFileAdapter) ParseRow(row []string, metadata *importFileMetadata) (*types.ImportableTrade, error) {
	symbol := row[metadata.symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	exchange := row[metadata.exchangeColumnIdx]
	if exchange == "" {
		return nil, fmt.Errorf("Exchange is empty in row")
	}

	tradeTypeStr := row[metadata.tradeTypeColumnIdx]
	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))

	quantityStr := row[metadata.quantityColumnIdx]
	quantity, err := decimal.NewFromString(quantityStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	priceStr := row[metadata.priceColumnIdx]
	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price at row : %s", priceStr)
	}

	dateStr := row[metadata.dateColumnIdx]
	timeStr := row[metadata.timeColumnIdx]
	dateTimeStr := dateStr + " " + timeStr

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeDateTime, err := time.ParseInLocation("02/01/2006 15:04:05", dateTimeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time at row : %s", timeStr)
	}

	// We will create our own order ID because Kotak Securities does not provide a unique order ID for each order.
	// We will use the "Symbol + Trade Date + Order Exec Time" as the order ID.
	orderExecTimeStr := row[metadata.orderExecutionTimeColumnIdx]
	orderID := symbol + " " + dateStr + " " + orderExecTimeStr

	instrument := types.InstrumentEquity
	shouldIgnore := false

	if strings.Contains(exchange, "DERV") || strings.Contains(exchange, "MCX") {
		if strings.HasPrefix(symbol, "OPT") {
			instrument = types.InstrumentOption

			fields := strings.Fields(symbol) // splits by spaces

			var underlying string
			isStockOption := false

			if strings.HasPrefix(fields[0], "OPTIDX") {
				underlying = strings.TrimPrefix(fields[0], "OPTIDX")
			} else if strings.HasPrefix(fields[0], "OPTSTK") {
				underlying = strings.TrimPrefix(fields[0], "OPTSTK")
				isStockOption = true
			} else if strings.HasPrefix(fields[0], "OPTFUT") {
				underlying = strings.TrimPrefix(fields[0], "OPTFUT")
			} else {
				underlying = fields[0]
			}

			if isStockOption {
				// Example: ["OPTSTKBAJAJ-AUTO24APR2025CE", "8000.00"]
				// underlying: BAJAJ-AUTO
				// expiry+type: 24APR2025CE
				// strike: 8000.00

				// Remove "-" from underlying
				// Use regex to split underlying from expiry/type/year/option suffix
				// The pattern is: underlying + expiry (2 digits + 3 letters) + year (4 digits) + option type (CE/PE)
				// e.g. BAJAJAUTO24APR2025CE

				stockOptPattern := regexp.MustCompile(`^([A-Z0-9\-]+)(\d{2}[A-Z]{3}\d{4}(CE|PE))$`)
				// Remove "OPTSTK" prefix
				raw := strings.TrimPrefix(fields[0], "OPTSTK")
				raw = strings.ReplaceAll(raw, "-", "")
				matches := stockOptPattern.FindStringSubmatch(raw)

				var underlying, expiryAndType string
				if len(matches) == 4 {
					underlying = matches[1]
					expiryAndType = matches[2]
				} else {
					// fallback to previous logic if regex fails
					underlying = raw
					expiryAndType = ""
				}

				strike := strings.Split(fields[1], ".")[0] // remove decimals

				// expiry = first 5 chars (24APR), optionType = last 2 chars (CE/PE)
				expiry := ""
				optionType := ""
				if len(expiryAndType) >= 7 {
					expiry = expiryAndType[:5]
					optionType = expiryAndType[len(expiryAndType)-2:]
				}

				symbol = fmt.Sprintf("%s%s%s%s", underlying, expiry, strike, optionType)
			} else {
				expiryAndType := fields[1]                 // e.g. "31JUL2025CE"
				strike := strings.Split(fields[2], ".")[0] // remove decimals

				expiry := expiryAndType[:5]
				optionType := expiryAndType[len(expiryAndType)-2:]

				symbol = fmt.Sprintf("%s%s%s%s", underlying, expiry, strike, optionType)
			}
		} else if strings.HasPrefix(symbol, "FUT") {
			instrument = types.InstrumentFuture
			fields := strings.Fields(symbol)
			var underlying, expiry string

			// FUTIDXBANKNIFTY 29MAY2025 or FUTCOMCRUDEOIL 19MAY2025
			if len(fields) >= 2 {
				// Remove "FUTIDX" or "FUTCOM" or "FUTSTK" prefix if present
				raw := fields[0]
				raw = strings.TrimPrefix(raw, "FUTIDX")
				raw = strings.TrimPrefix(raw, "FUTCOM")
				raw = strings.TrimPrefix(raw, "FUTSTK")
				underlying = raw

				expiryRaw := fields[1]
				// expiryRaw is like "29MAY2025", we want "29MAY"
				if len(expiryRaw) >= 5 {
					expiry = expiryRaw[:5]
				}
				symbol = fmt.Sprintf("%s%s", underlying, expiry)
			}
		} else {
			// We do not know which instrument this is, so we will ignore it.
			shouldIgnore = true
		}
	}

	if shouldIgnore {
		fmt.Printf("Ignoring trade for symbol: %s on exchange: %s\n", symbol, exchange)
	}

	return &types.ImportableTrade{
		Symbol:       symbol,
		Instrument:   instrument,
		TradeKind:    tradeKind,
		Quantity:     quantity,
		Price:        price,
		OrderID:      orderID,
		Time:         tradeDateTime,
		ShouldIgnore: shouldIgnore,
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
