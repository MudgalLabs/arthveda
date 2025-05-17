package trade

type Trade struct {
	ID      int64 `json:"id" db:"id"`
	TradeID int64 `json:"trade_id" db:"trade_id"` // The ID of the Trade to which this SubTrade belongs to.
	Kind    Kind  `json:"kind" db:"kind"`
}

type Kind string

const (
	TradeKindBuy  Kind = "buy"
	TradeKindSell Kind = "sell"
)
