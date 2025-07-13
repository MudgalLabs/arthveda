package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func CalculateAndApplyChargesToTrades(trades []*trade.Trade, instrument types.Instrument, brokerName broker.Name) (charges []decimal.Decimal, userError bool, err error) {
	charges = make([]decimal.Decimal, len(trades))

	intraday := EquityTradeIntraday
	delivery := EquityTradeDelivery

	equityIntradayChargesConfig := getComputeTradeChargesConfig(brokerName, instrument, &intraday)
	equityDeliveryChargesConfig := getComputeTradeChargesConfig(brokerName, instrument, &delivery)

	chargeContextByTradeID, userError, err := computeEquityTradeChargesContext(trades)
	if err != nil {
		return charges, userError, err
	}

	for i, trade := range trades {
		if instrument == types.InstrumentEquity {
			chargeContext, exists := chargeContextByTradeID[trade.ID]
			if !exists {
				// If we don't have a charges context for the trade, we skip it.
				charges[i] = decimal.Zero
				trades[i].ChargesAmount = decimal.Zero
				continue
			}

			finalCharges := decimal.Zero

			// For equity trades, we will need to take care of intraday and delivery.
			for _, split := range chargeContext.ChargesSplits {
				var config computeChargesConfig

				switch split.EquityTradeKind {
				case EquityTradeIntraday:
					config = equityIntradayChargesConfig
				case EquityTradeDelivery:
					config = equityDeliveryChargesConfig
				default:
					// If we encounter an unknown equity trade kind, we skip it.
					continue
				}

				// Log the context and split for debugging purposes.
				logger.Get().Debugw("CalculateAndApplyChargesToTrades",
					"trade_id", trade.ID,
					"equity_trade_kind", split.EquityTradeKind,
					"quantity", split.Quantity,
					"price", trade.Price,
					"config", config,
				)

				// Calculate the total charges for the trade based on the split.
				tradeValue := split.Quantity.Mul(trade.Price)
				charges := getTotalChargesForTrade(tradeValue, trade.Kind, config)
				finalCharges = finalCharges.Add(charges)
			}

			charges[i] = finalCharges

			// Apply the charges to the trade.
			trades[i].ChargesAmount = finalCharges
		} else {
			// TODO: Handle other instruments if needed.
			return charges, false, nil
		}
	}

	return charges, false, nil
}

func calculateTotalChargesAmountFromTrades(trades []*trade.Trade) decimal.Decimal {
	totalCharges := decimal.Zero

	for _, t := range trades {
		if t.ChargesAmount.IsPositive() {
			totalCharges = totalCharges.Add(t.ChargesAmount)
		}
	}

	return totalCharges
}

// getTotalChargesForTrade computes the total charges for a trade based on the trade value and the configuration.
// tradeValue is the value of the trade (quantity * price).
func getTotalChargesForTrade(tradeValue decimal.Decimal, tradeKind types.TradeKind, config computeChargesConfig) decimal.Decimal {
	// Calcualte brokerage
	// Formula : tradeValue * brokeragePercent -> apply min/max
	brokerageCharges := tradeValue.Mul(decimal.NewFromFloat(config.brokerage.percent / 100))

	// Apply min/max brokerage charges
	if brokerageCharges.GreaterThan(decimal.NewFromFloat(config.brokerage.max)) {
		brokerageCharges = decimal.NewFromFloat(config.brokerage.max)
	}

	if brokerageCharges.LessThan(decimal.NewFromFloat(config.brokerage.min)) {
		brokerageCharges = decimal.NewFromFloat(config.brokerage.min)
	}

	// Calculate STT
	var sttCharges decimal.Decimal

	switch tradeKind {
	case types.TradeKindBuy:
		sttCharges = tradeValue.Mul(decimal.NewFromFloat(config.stt.percentOnBuy / 100))
	case types.TradeKindSell:
		sttCharges = tradeValue.Mul(decimal.NewFromFloat(config.stt.percentOnSell / 100))
	}

	// Calculate exchange transaction charges
	// TODO: We need to pass exchange as a parameter to this function.
	exchangeTxnCharges := tradeValue.Mul(decimal.NewFromFloat(config.exchangeTransactionCharges.percentForNSE / 100))

	// Calculate stamp charges
	var stampCharges decimal.Decimal

	if tradeKind == types.TradeKindBuy {
		stampCharges = tradeValue.Mul(decimal.NewFromFloat(config.stampChargesPercent / 100))
	}

	// calculate SEBI charges
	sebiCharges := tradeValue.Mul(decimal.NewFromFloat(config.sebiChargesPercent / 100))

	// Calculate DP charges
	var dpCharges decimal.Decimal

	// DP charges are only applicable for sell trades.
	if tradeKind == types.TradeKindSell {
		dpCharges = config.dpChargesAmount
	}

	// Calculate NSE Investor Protection Fund charges
	nseInvestorProtectionFundCharges := tradeValue.Mul(decimal.NewFromFloat(config.nseInvestorProtectionFundPercentage / 100))

	// Calculate GST on brokerage, sebi charges & exchange transaction charges
	gstCharges := brokerageCharges.Add(sebiCharges).Add(exchangeTxnCharges).Mul(decimal.NewFromFloat(config.gstPercent / 100))

	// We will add other charges later, for now we just set the brokerage charges.
	totalCharges := brokerageCharges.Add(sttCharges).Add(exchangeTxnCharges).Add(stampCharges).Add(sebiCharges).Add(dpCharges).Add(nseInvestorProtectionFundCharges).Add(gstCharges)

	// Log the charges for debugging purposes.
	logger.Get().Debugw("getTotalChargesForTrade",
		"trade_value", tradeValue,
		"trade_kind", tradeKind,
		"brokerage_charges", brokerageCharges,
		"stt_charges", sttCharges,
		"exchange_txn_charges", exchangeTxnCharges,
		"stamp_charges", stampCharges,
		"sebi_charges", sebiCharges,
		"dp_charges", dpCharges,
		"nse_investor_protection_fund_charges", nseInvestorProtectionFundCharges,
		"gst_charges", gstCharges,
		"total_charges", totalCharges,
	)

	return totalCharges
}

type equityTradeKind = string

const (
	EquityTradeIntraday equityTradeKind = "intraday"
	EquityTradeDelivery equityTradeKind = "delivery"
)

type equityTradeChargeSplit struct {
	// Quantity of the trade for which this charge is applicable.
	Quantity decimal.Decimal `json:"quantity"`

	// EquityTradeKind of charge split.
	EquityTradeKind equityTradeKind `json:"equity_trade_kind"`
}

type equityTradeChargesContext struct {
	TradeID       uuid.UUID                `json:"trade_id"`
	ChargesSplits []equityTradeChargeSplit `json:"charges_splits"`
}

// chargeContextByTradeId is a map of trade ID to the charges context for that trade.
type computeEquityTradeChargesContextResult = map[uuid.UUID]*equityTradeChargesContext

// computeEquityTradeChargesContext computes the charges context for all the trades of a EQUITY position only.
// The context allows us to later compute the charges for each trade based on the splits.
// Each split tells us how much quantity of a trade is applicable for a particular charge kind (intraday or delivery).
func computeEquityTradeChargesContext(trades []*trade.Trade) (chargeContextByTradeID computeEquityTradeChargesContextResult, userError bool, err error) {
	// We will keep track of the charges context for each trade.
	chargeContextByTradeID = make(map[uuid.UUID]*equityTradeChargesContext)

	// Safety check
	if len(trades) == 0 {
		return chargeContextByTradeID, false, nil
	}

	// Hardcoded timezone for Asia/Kolkata (IST).
	// TODO: Store `Exchange` in Trade and use that to determine the timezone?
	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	loc, _ := time.LoadLocation(string(tz))

	// Convert trade.Time to IST timezone because trades are in UTC.
	// If we don't convert the time, we will not be able to correctly determine
	// if the trades are on the same day or not because the trades are in UTC
	// and UTC time can break a trade into two different days that isn't matching
	// the expected day in IST.
	for _, t := range trades {
		t.Time = t.Time.In(loc)
	}

	// We assume that the trades are sorted by time.
	// So the first trade is the opening trade of the position.
	openTrade := trades[0]

	// Keep track of trades of the opposite kind to the open trade.
	// We will use this to mark the opposite trades as intraday or delivery.
	// After looping through all trades, we will have a map of trades that are of
	// the opposite kind to the open trade and their remaining quantity and they
	// will be considered as delivery trades because they were not consumed by any
	// opposite trades on the same day.
	otherKindTradesWithRemainingQty := map[uuid.UUID]decimal.Decimal{}

	// We will loop through all trades, until we reach a trade that is after the opening trade
	for i, currTrade := range trades {
		// If the trade is matching the open trade kind, we are scaling in.
		// So all the same direction trades can be just added directly.
		if currTrade.Kind == openTrade.Kind {
			otherKindTradesWithRemainingQty[currTrade.ID] = currTrade.Quantity
			continue
		}

		// We have come across a trade that isn't matching the kind for the open trade.
		// So in a long position, this would be sell trade and vice-versa.
		// PERF: Nested loops. Can we optimize this?
		if currTrade.Kind != openTrade.Kind {
			// We will keep reducting this qty if we find opposite trades when looping backwards.
			// If this quantity hits 0, or we hit a trade that was done on a different day,
			// we will add a charge split as delivery for this qty.
			// NOTE: This value gets mutated !!!
			currTradeQtyRemaining := currTrade.Quantity

			// We need to loop backwards to find the previous trades of opposite kind
			// and mark them as intraday for the quantity that was traded in this trade.
			for j := i - 1; j >= 0; j-- {
				prevTrade := trades[j]

				if prevTrade.Kind == currTrade.Kind {
					// Skip same kind trades as we want to update the opposite side if they exists.
					continue
				}

				// If we reach a trade that is on a different day,
				// we will mark the current trade as delivery for the remaining quantity.
				if prevTrade.Time.Day() != currTrade.Time.Day() {
					split := equityTradeChargeSplit{
						Quantity:        currTradeQtyRemaining,
						EquityTradeKind: EquityTradeDelivery,
					}

					chargeContextByTradeID[currTrade.ID] = &equityTradeChargesContext{
						TradeID:       currTrade.ID,
						ChargesSplits: []equityTradeChargeSplit{split},
					}

					// We no longer have to keep going back as we have reached another day,
					// meaning whatever quantity is left is delivery.
					break
				}

				// We have a previous trade that is on the same day as the current trade
				// and the trade is of opposite kind.
				if prevTrade.Time.Day() == currTrade.Time.Day() {
					// If the previous trade is on the same day as the opening trade,
					// we know that this is an intraday trade.
					// We will mark the previous opposite kind trade as intraday for the quantity that was in this trade.
					// Also mark this trade as a intraday.

					if prevTradeRemainingQty, exists := otherKindTradesWithRemainingQty[prevTrade.ID]; exists {
						prevTradeChargesContext, exists := chargeContextByTradeID[prevTrade.ID]
						if !exists {
							// If we don't have a context for the previous trade, we create one.
							prevTradeChargesContext = &equityTradeChargesContext{
								TradeID:       prevTrade.ID,
								ChargesSplits: []equityTradeChargeSplit{},
							}
							chargeContextByTradeID[prevTrade.ID] = prevTradeChargesContext
						}

						currTradeChargesContext, exists := chargeContextByTradeID[currTrade.ID]
						if !exists {
							// If we don't have a context for the current trade, we create one.
							currTradeChargesContext = &equityTradeChargesContext{
								TradeID:       currTrade.ID,
								ChargesSplits: []equityTradeChargeSplit{},
							}
							chargeContextByTradeID[currTrade.ID] = currTradeChargesContext
						}

						var newPrevRemainingQty, newCurrTradeQty, qtyReduced decimal.Decimal

						// If the previous trade has remaining quantity more than the current trade quantity,
						// we can subtract the current trade quantity from the previous trade remaining quantity.
						if prevTradeRemainingQty.GreaterThanOrEqual(currTradeQtyRemaining) {
							newPrevRemainingQty = prevTradeRemainingQty.Sub(currTradeQtyRemaining)
							newCurrTradeQty = decimal.Zero
							qtyReduced = currTradeQtyRemaining
						} else {
							// If the previous trade remaining quantity is less than the current trade quantity,
							// we will subtract the previous trade remaining quantity from the current trade quantity.
							newPrevRemainingQty = decimal.Zero
							newCurrTradeQty = currTradeQtyRemaining.Sub(prevTradeRemainingQty)
							qtyReduced = prevTradeRemainingQty
						}

						// Add the charge split for the previous trade as intraday for the quantity that was sold.
						prevTradeChargesContext.ChargesSplits = append(prevTradeChargesContext.ChargesSplits, equityTradeChargeSplit{
							Quantity:        qtyReduced,
							EquityTradeKind: EquityTradeIntraday,
						})

						// Add the charge split for the current trade as intraday for the quantity that was sold.
						currTradeChargesContext.ChargesSplits = append(currTradeChargesContext.ChargesSplits, equityTradeChargeSplit{
							Quantity:        qtyReduced,
							EquityTradeKind: EquityTradeIntraday,
						})

						// Update the remaining quantity for the previous trade.
						otherKindTradesWithRemainingQty[prevTrade.ID] = newPrevRemainingQty
						// Update the current trade quantity remaining.
						currTradeQtyRemaining = newCurrTradeQty

						chargeContextByTradeID[prevTrade.ID] = prevTradeChargesContext
						chargeContextByTradeID[currTrade.ID] = currTradeChargesContext

						// If we consume all the previous trade remaining quantity,
						// we need to make sure we haven't reached the start of the trades.
						// If we have reached the start of the trades and we have quantity left for the
						// current trade, that means have imbalance of quantity.
						// This is a case where we have sold more quantity than we had bought or vice-versa.
						if j == 0 && newCurrTradeQty.GreaterThan(decimal.Zero) {
							if openTrade.Kind == types.TradeKindBuy {
								// If the open trade is a buy, it means we have sold more quantity than we had bought.
								return chargeContextByTradeID, true, fmt.Errorf("You cannot sell more quantity than you have open")
							} else {
								// If the open trade is a sell, it means we have bought more quantity than we had sold.
								return chargeContextByTradeID, true, fmt.Errorf("You cannot buy more quantity than you have open")
							}
						}

						// If the current trade quantity remaining is zero, we can break.
						if currTradeQtyRemaining.IsZero() {
							// We have consumed all the quantity of the current trade,
							// so we can break out of the loop.
							break
						}
					}
				}
			}
		}
	}

	// After looping through all trades, we will have a map of trades that are of
	// the opposite kind to the open trade and their remaining quantity.
	// We will mark these trades as delivery for the remaining quantity.
	for tradeID, qty := range otherKindTradesWithRemainingQty {
		if qty.IsPositive() {
			context, exists := chargeContextByTradeID[tradeID]
			if !exists {
				// If we don't have a context for the trade, we create one.
				context = &equityTradeChargesContext{
					TradeID:       tradeID,
					ChargesSplits: []equityTradeChargeSplit{},
				}
				chargeContextByTradeID[tradeID] = context
			}

			split := equityTradeChargeSplit{
				Quantity:        qty,
				EquityTradeKind: EquityTradeDelivery,
			}

			// Add the charge split for the trade as delivery for the remaining quantity.
			context.ChargesSplits = append(context.ChargesSplits, split)
			chargeContextByTradeID[tradeID] = context
		}
	}

	return chargeContextByTradeID, false, nil
}

type brokerageConfig struct {
	percent float64
	max     float64
	min     float64
}

type sttConfig struct {
	percentOnBuy  float64
	percentOnSell float64
}

type exchangeTransactionChargesConfig struct {
	percentForNSE float64
	percentForBSE float64
}

// TODO: Instead of using float64 for percentages, we should use decimal.Decimal for better precision?
type computeChargesConfig struct {
	brokerage                           brokerageConfig
	stt                                 sttConfig
	exchangeTransactionCharges          exchangeTransactionChargesConfig
	stampChargesPercent                 float64
	sebiChargesPercent                  float64
	dpChargesAmount                     decimal.Decimal
	nseInvestorProtectionFundPercentage float64
	gstPercent                          float64
}

// TODO: We need to pass exchange as a parameter to this function
// so that we can compute the charges based on the exchange.
func getComputeTradeChargesConfig(brokerName broker.Name, instrument types.Instrument, etk *equityTradeKind) computeChargesConfig {
	const (
		gstPercent         = 18
		sebiChargesPercent = 0.0001
	)

	config := computeChargesConfig{
		brokerage:                           getBrokerageConfig(brokerName, instrument, etk),
		stt:                                 getSttConfig(instrument, etk),
		exchangeTransactionCharges:          getExchangeTransactionChargesConfig(instrument),
		stampChargesPercent:                 getStampChargesPercent(instrument, etk),
		sebiChargesPercent:                  sebiChargesPercent,
		dpChargesAmount:                     getDpChargesAmount(brokerName, etk),
		nseInvestorProtectionFundPercentage: getNSEInvestorProtectionFundPercentage(instrument),
		gstPercent:                          gstPercent,
	}

	return config
}

func getBrokerageConfig(brokerName broker.Name, instrument types.Instrument, etk *equityTradeKind) brokerageConfig {
	config := brokerageConfig{}

	if instrument == types.InstrumentEquity {
		switch brokerName {
		case broker.BrokerNameZerodha:
			// No brokerage for Zerodha on delivery trades.
			if etk != nil && *etk == EquityTradeIntraday {
				config.percent = 0.03
				config.max = 20
				config.min = 0
			}
		case broker.BrokerNameGroww:
			config.percent = 0.1
			config.max = 20
			config.min = 5
		case broker.BrokerNameUpstox:
			if etk != nil && *etk == EquityTradeIntraday {
				config.percent = 0.1
				config.max = 20
				config.min = 0
			} else {
				// Flat 20 for delivery trades.
				config.min = 20
			}
		default:
			logger.Get().Errorw("getBrokerageChargesConfig: unknown broker for equity trade charges config", "broker", brokerName)
		}
	} else {
		// For other instruments, we can define different configs if needed.
		// Right now, we are not handling other instruments.
		return config
	}

	return config
}

func getSttConfig(instrument types.Instrument, etk *equityTradeKind) sttConfig {
	const (
		sttPercentOnSellIntraday = 0.025
		sttPercentOnBuyDelivery  = 0.1
		sttPercentOnSellDelivery = 0.1
	)

	stt := sttConfig{}

	if instrument == types.InstrumentEquity {
		if etk != nil {
			switch *etk {
			case EquityTradeIntraday:
				stt.percentOnSell = sttPercentOnSellIntraday
			case EquityTradeDelivery:
				stt.percentOnBuy = sttPercentOnBuyDelivery
				stt.percentOnSell = sttPercentOnSellDelivery
			}
		}
	}

	return stt
}

func getExchangeTransactionChargesConfig(instrument types.Instrument) exchangeTransactionChargesConfig {
	const (
		txnEquityChargesPercentForNSE = 0.00297
		txnEquityChargesPercentForBSE = 0.00375
	)

	exchangeTransactionCharges := exchangeTransactionChargesConfig{}

	if instrument == types.InstrumentEquity {
		exchangeTransactionCharges.percentForNSE = txnEquityChargesPercentForNSE
		exchangeTransactionCharges.percentForBSE = txnEquityChargesPercentForBSE
	}

	return exchangeTransactionCharges
}

func getStampChargesPercent(instrument types.Instrument, etk *equityTradeKind) float64 {
	const (
		stampEquityDeliveryChargesPercentOnBuy = 0.015
		stampEquityIntradayChargesPercentOnBuy = 0.003
	)

	var stampChargesPercent float64

	if instrument == types.InstrumentEquity {
		if etk != nil {
			switch *etk {
			case EquityTradeIntraday:
				stampChargesPercent = stampEquityIntradayChargesPercentOnBuy
			case EquityTradeDelivery:
				stampChargesPercent = stampEquityDeliveryChargesPercentOnBuy
			}
		}
	}

	return stampChargesPercent
}

func getDpChargesAmount(b broker.Name, etk *equityTradeKind) decimal.Decimal {
	if etk == nil {
		return decimal.Zero
	}

	// DP charges are not applicable for intraday trades.
	if *etk == EquityTradeIntraday {
		return decimal.Zero
	}

	switch b {
	case broker.BrokerNameGroww:
		return decimal.NewFromFloat(16.5)
	case broker.BrokerNameZerodha:
		return decimal.NewFromFloat(15.34)
	case broker.BrokerNameUpstox:
		return decimal.NewFromFloat(20.0)
	default:
		logger.Get().Errorw("getDpChargesAmount: unknown broker for dp charges", "broker", b)
		return decimal.Zero
	}
}

func getNSEInvestorProtectionFundPercentage(instrument types.Instrument) float64 {
	var (
		equityNSEInvestorProtectionFundPercentage = 0.0001
	)

	switch instrument {
	case types.InstrumentEquity:
		return equityNSEInvestorProtectionFundPercentage
	default:
		return 0
	}
}
