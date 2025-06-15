package trade

type Exchange string

const (
	ExchangeNSE Exchange = "nse"
	ExchangeBSE Exchange = "bse"
	// add more as needed
)

type ExchangeTZ string

const AsiaKolkataTZ ExchangeTZ = "Asia/Kolkata"

var exchangeTZByExchange = map[Exchange]ExchangeTZ{
	ExchangeNSE: AsiaKolkataTZ,
	ExchangeBSE: AsiaKolkataTZ,
	// add more as needed
}
