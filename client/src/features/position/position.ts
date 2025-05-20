import { CurrencyCode } from "@/lib/api/currency";
import { Trade } from "../trade/trade";

type PositionInstrument = "equity" | "future" | "option";

function positionInstrumentToString(instrument: PositionInstrument): string {
    switch (instrument) {
        case "equity":
            return "Equity";
        case "future":
            return "Future";
        case "option":
            return "Option";
    }
}

type PositionDirection = "long" | "short";

function positionDirectionToString(position: PositionDirection): string {
    switch (position) {
        case "long":
            return "Long";
        case "short":
            return "Short";
    }
}

type PositionStatus = "open" | "breakeven" | "win" | "loss";

function positionStatusToString(position: PositionDirection): string {
    switch (position) {
        case "long":
            return "Long";
        case "short":
            return "Short";
    }
}

interface Position {
    id: number;
    user_id: number;
    created_at: Date;
    updated_at: Date | null;

    symbol: string;
    instrument: PositionInstrument;
    currency: CurrencyCode;
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

export {
    positionInstrumentToString,
    positionDirectionToString,
    positionStatusToString,
};

export type {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
};
