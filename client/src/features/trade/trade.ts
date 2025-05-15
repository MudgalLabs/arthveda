type InstrumentKind = "equity" | "future " | "option";

type OrderKind = "buy" | "sell";

type DirectionKind = "long" | "short";

type OutcomeKind = "open" | "win" | "loss" | "breakeven";

// We currently support only INR.
// TODO: Shouldn't this be somewhere else? Currency will probably be used in
// several places. We will most likely fetch the list of currencies from API.
type CurrencyKind = "INR";

export type {
    CurrencyKind,
    DirectionKind,
    InstrumentKind,
    OrderKind,
    OutcomeKind,
};
