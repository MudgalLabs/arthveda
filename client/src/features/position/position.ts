type PositionInstrument = "equity" | "future " | "option";

type PositionDirection = "long" | "short";

type PositionStatus = "open" | "win" | "loss" | "breakeven";

// We currently support only INR.
// TODO: Shouldn't this be somewhere else? Currency will probably be used in
// several places. We will most likely fetch the list of currencies from API.
type CurrencyCode = "INR";

export type {
    CurrencyCode,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
};
