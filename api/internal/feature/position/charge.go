package position

import (
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"fmt"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func CalculateAndApplyChargesToTrades(trades []*trade.Trade, instrument Instrument, brokerName broker.Name) (charges []decimal.Decimal, userError bool, err error) {
	charges = make([]decimal.Decimal, len(trades))

	intraday := EquityTradeIntraday
	delivery := EquityTradeDelivery

	equityIntradayChargesConfig := getComputeTradeChargesConfig(brokerName, instrument, &intraday)
	equityDeliveryChargesConfig := getComputeTradeChargesConfig(brokerName, instrument, &delivery)

	chargeContextByTradeId, userError, err := computeEquityTradeChargesContext(trades)
	if err != nil {
		return charges, userError, err
	}

	for i, trade := range trades {
		var config computeChargesConfig

		if instrument == InstrumentEquity {
			chargeContext, exists := chargeContextByTradeId[trade.ID]
			if !exists {
				// If we don't have a charges context for the trade, we skip it.
				charges[i] = decimal.Zero
				trades[i].ChargesAmount = decimal.Zero
				continue
			}

			// For equity trades, we will need to take care of intraday and delivery.
			for _, split := range chargeContext.ChargesSplits {
				switch split.EquityTradeKind {
				case EquityTradeIntraday:
					config = equityIntradayChargesConfig
				case EquityTradeDelivery:
					config = equityDeliveryChargesConfig
				default:
					// If we encounter an unknown equity trade kind, we skip it.
					continue
				}

				// Calculate the total charges for the trade based on the split.
				tradeValue := trade.Quantity.Mul(trade.Price)
				totalCharges := getTotalChargesForTrade(tradeValue, config)
				charges[i] = totalCharges
				// Apply the charges to the trade.
				trades[i].ChargesAmount = totalCharges
			}
		} else {
			// TODO: Handle other instruments if needed.
		}
	}

	return charges, false, nil
}

// getTotalChargesForTrade computes the total charges for a trade based on the trade value and the configuration.
// tradeValue is the value of the trade (quantity * price).
func getTotalChargesForTrade(tradeValue decimal.Decimal, config computeChargesConfig) decimal.Decimal {
	// Brokerage charges
	// Formule : tradeValue * brokeragePercent -> apply min/max
	brokerageCharges := tradeValue.Mul(decimal.NewFromFloat(config.brokerage.percent / 100))

	// Apply min/max brokerage charges
	if brokerageCharges.GreaterThan(decimal.NewFromFloat(config.brokerage.max)) {
		brokerageCharges = decimal.NewFromFloat(config.brokerage.max)
	}
	if brokerageCharges.LessThan(decimal.NewFromFloat(config.brokerage.min)) {
		brokerageCharges = decimal.NewFromFloat(config.brokerage.min)
	}

	// We will add other charges later, for now we just set the brokerage charges.
	totalCharges := brokerageCharges

	return totalCharges
}

type equityTrade = string

const (
	EquityTradeIntraday equityTrade = "intraday"
	EquityTradeDelivery equityTrade = "delivery"
)

type equityTradeChargeSplit struct {
	// Quantity of the trade for which this charge is applicable.
	Quantity decimal.Decimal `json:"quantity"`

	// EquityTradeKind of charge split.
	EquityTradeKind equityTrade `json:"equity_trade_kind"`
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
func computeEquityTradeChargesContext(trades []*trade.Trade) (chargeContextByTradeId computeEquityTradeChargesContextResult, userError bool, err error) {
	// We will keep track of the charges context for each trade.
	chargeContextByTradeId = make(map[uuid.UUID]*equityTradeChargesContext)

	// Safety check
	if len(trades) == 0 {
		return chargeContextByTradeId, false, nil
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

					chargeContextByTradeId[currTrade.ID] = &equityTradeChargesContext{
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
						prevTradeChargesContext, exists := chargeContextByTradeId[prevTrade.ID]
						if !exists {
							// If we don't have a context for the previous trade, we create one.
							prevTradeChargesContext = &equityTradeChargesContext{
								TradeID:       prevTrade.ID,
								ChargesSplits: []equityTradeChargeSplit{},
							}
							chargeContextByTradeId[prevTrade.ID] = prevTradeChargesContext
						}

						currTradeChargesContext, exists := chargeContextByTradeId[currTrade.ID]
						if !exists {
							// If we don't have a context for the current trade, we create one.
							currTradeChargesContext = &equityTradeChargesContext{
								TradeID:       currTrade.ID,
								ChargesSplits: []equityTradeChargeSplit{},
							}
							chargeContextByTradeId[currTrade.ID] = currTradeChargesContext
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

						chargeContextByTradeId[prevTrade.ID] = prevTradeChargesContext
						chargeContextByTradeId[currTrade.ID] = currTradeChargesContext

						// If we consume all the previous trade remaining quantity,
						// we need to make sure we haven't reached the start of the trades.
						// If we have reached the start of the trades and we have quantity left for the
						// current trade, that means have imbalance of quantity.
						// This is a case where we have sold more quantity than we had bought or vice-versa.
						if j == 0 && newCurrTradeQty.GreaterThan(decimal.Zero) {
							if openTrade.Kind == trade.TradeKindBuy {
								// If the open trade is a buy, it means we have sold more quantity than we had bought.
								return chargeContextByTradeId, true, fmt.Errorf("You cannot sell more quantity than you have open")
							} else {
								// If the open trade is a sell, it means we have bought more quantity than we had sold.
								return chargeContextByTradeId, true, fmt.Errorf("You cannot buy more quantity than you have open")
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
			context, exists := chargeContextByTradeId[tradeID]
			if !exists {
				// If we don't have a context for the trade, we create one.
				context = &equityTradeChargesContext{
					TradeID:       tradeID,
					ChargesSplits: []equityTradeChargeSplit{},
				}
				chargeContextByTradeId[tradeID] = context
			}

			split := equityTradeChargeSplit{
				Quantity:        qty,
				EquityTradeKind: EquityTradeDelivery,
			}

			// Add the charge split for the trade as delivery for the remaining quantity.
			context.ChargesSplits = append(context.ChargesSplits, split)
			chargeContextByTradeId[tradeID] = context
		}
	}

	return chargeContextByTradeId, false, nil
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

type computeChargesConfig struct {
	brokerage                  brokerageConfig
	stt                        sttConfig
	exchangeTransactionCharges exchangeTransactionChargesConfig
	stampChargesPercent        float64
	sebiChargesPercent         float64
	gstPercent                 float64
}

func getComputeTradeChargesConfig(brokerName broker.Name, instrument Instrument, etk *equityTrade) computeChargesConfig {
	const (
		gstPercent         = 18
		sebiChargesPercent = 0.0001
	)

	config := computeChargesConfig{
		brokerage:                  getBrokerageConfig(brokerName, instrument, etk),
		stt:                        getSttConfig(instrument, etk),
		exchangeTransactionCharges: getExchangeTransactionChargesConfig(instrument),
		stampChargesPercent:        getStampChargesPercent(instrument, etk),
		sebiChargesPercent:         sebiChargesPercent,
		gstPercent:                 gstPercent,
	}

	return config
}

func getBrokerageConfig(brokerName broker.Name, instrument Instrument, etk *equityTrade) brokerageConfig {
	config := brokerageConfig{}

	if instrument == InstrumentEquity {
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
		default:
			logger.Get().Errorw("getBrokerageChargesConfig: unknown broker for equity trade charges config", "broker", brokerName)
		}
	} else {
		// For other instruments, we can define different configs if needed.
		// Right now, we are not handling other instruments.
	}

	return config
}

func getSttConfig(instrument Instrument, etk *equityTrade) sttConfig {
	const (
		sttPercentOnSellIntraday = 0.025
		sttPercentOnBuyDelivery  = 0.1
		sttPercentOnSellDelivery = 0.1
	)

	stt := sttConfig{}

	if instrument == InstrumentEquity {
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

func getExchangeTransactionChargesConfig(instrument Instrument) exchangeTransactionChargesConfig {
	const (
		txnEquityChargesPercentForNSE = 0.00297
		txnEquityChargesPercentForBSE = 0.00375
	)

	exchangeTransactionCharges := exchangeTransactionChargesConfig{}

	if instrument == InstrumentEquity {
		exchangeTransactionCharges.percentForNSE = txnEquityChargesPercentForNSE
		exchangeTransactionCharges.percentForBSE = txnEquityChargesPercentForBSE
	}

	return exchangeTransactionCharges
}

func getStampChargesPercent(instrument Instrument, etk *equityTrade) float64 {
	const (
		stampEquityDeliveryChargesPercentOnBuy = 0.015
		stampEquityIntradayChargesPercentOnBuy = 0.003
	)

	var stampChargesPercent float64

	if instrument == InstrumentEquity {
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
