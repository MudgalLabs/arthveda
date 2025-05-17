import { Trade } from "../trade/trade";

type PositionInstrument = "equity" | "future " | "option";

type PositionDirection = "long" | "short";

type PositionStatus = "open" | "breakeven" | "win" | "loss";

// We currently support only INR.
// TODO: Shouldn't this be somewhere else? Currency will probably be used in
// several places. We will most likely fetch the list of currencies from API.
type CurrencyCode = "INR";

interface Position {
    id: number;
    user_id: number;

    symbol: string;
    instrument: PositionInstrument;
    currency_code: CurrencyCode;
    risk_amount: string;
    charges_amount: string;

    direction: PositionDirection;
    status: PositionStatus;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: string;
    net_pnl_amount: string;
    r_factor: number;
    net_return_percentage: number;
    charges_as_percentage_of_net_pnl: number;
    open_quantity: string;
    open_average_price_amount: string;

    trades: Trade[];
}

export type {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
};
