import { CurrencyCode } from "@/lib/api/currency";
import { Trade } from "@/features/trade/trade";
import { DecimalString } from "@/lib/types";
import { Content } from "@tiptap/react";

type PositionInstrument = "equity" | "future" | "option" | "crypto";

function positionInstrumentToString(instrument: PositionInstrument): string {
    switch (instrument) {
        case "equity":
            return "Equity";
        case "future":
            return "Futures";
        case "option":
            return "Options";
        case "crypto":
            return "Crypto";
        default:
            return "";
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

function positionStatusToString(status: PositionStatus): string {
    switch (status) {
        case "open":
            return "Open";
        case "breakeven":
            return "Breakeven";
        case "win":
            return "Win";
        case "loss":
            return "Loss";
        default:
            return status;
    }
}

interface UserBrokerAccountSearchValue {
    id: string;
    name: string;
    broker_id: string;
}

interface Position {
    id: string;
    created_by: string;
    created_at: Date;
    updated_at: Date | null;

    symbol: string;
    instrument: PositionInstrument;
    currency: CurrencyCode;
    risk_amount: DecimalString;
    // notes: string;

    total_charges_amount: DecimalString;
    direction: PositionDirection;
    status: PositionStatus;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: DecimalString;
    net_pnl_amount: DecimalString;
    r_factor: DecimalString;
    net_return_percentage: DecimalString;
    charges_as_percentage_of_net_pnl: DecimalString;
    open_quantity: DecimalString;
    open_average_price_amount: DecimalString;
    user_broker_account_id: string | null;

    trades: Trade[] | null;
    user_broker_account: UserBrokerAccountSearchValue | null;
    journal_content: Content | undefined;
    is_duplicate: boolean;
}

export { positionInstrumentToString, positionDirectionToString, positionStatusToString };

export type {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
    UserBrokerAccountSearchValue,
};
