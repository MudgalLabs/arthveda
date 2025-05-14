type InstrumentKind = "equity" | "future " | "options";

type OrderKind = "buy" | "sell";

type DirectionKind = "long" | "short";

type OutcomeKind = "open" | "win" | "loss" | "breakeven";

// We currently support only INR.
// TODO: Shouldn't this be somewhere else? Currency will probably be used in
// several places. We will most likely fetch the list of currencies from API.
type CurrencyKind = "INR";

/**
 * Arthveda will calculate some data points based on what user has input on
 * the "Add Trade" page.
 */
interface ProcessTradeResult {
    direction: DirectionKind;
    outcome: OutcomeKind;
    opened_at: Date;
    /** If `null` the trade is still open/active. */
    closed_at: Date | null;
    r_factor: number;
    gross_pnl_amount: number;
    net_pnl_amount: number;
    net_return_percentage: number;
    cost_as_percentage_of_net_pnl: number;
}

interface SubTrade {
    id: number;
    order_kind: OrderKind;
    time: Date;
    quantity: number;
    price: number;
}

interface Trade {
    symbol: string;
    instrument: InstrumentKind;
    currency: CurrencyKind;
    planned_risk_amount: number;
    charges_amount: number;
}

export type {
    CurrencyKind,
    DirectionKind,
    InstrumentKind,
    OrderKind,
    OutcomeKind,
    ProcessTradeResult,
    SubTrade,
    Trade,
};
