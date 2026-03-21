import { CurrencyCode } from "@/lib/api/currency";
import { Trade } from "@/features/trade/trade";
import { DecimalString } from "@/lib/types";
import { Content } from "@tiptap/react";
import { Tag } from "@/lib/api/tag";

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
    risk_amount: DecimalString;
    total_charges_amount: DecimalString;
    currency_code: CurrencyCode;
    enable_auto_charges: boolean;

    direction: PositionDirection;
    status: PositionStatus;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: DecimalString;
    net_pnl_amount: DecimalString;
    r_factor: DecimalString;
    gross_r_factor: DecimalString;
    net_return_percentage: DecimalString;
    charges_as_percentage_of_net_pnl: DecimalString;
    open_quantity: DecimalString;
    open_average_price_amount: DecimalString;
    user_broker_account_id: string | null;

    fx_rate: DecimalString;
    fx_source: "system" | "manual";
    gross_pnl_amount_away: DecimalString | null;
    total_charges_amount_away: DecimalString | null;
    net_pnl_amount_away: DecimalString | null;

    trades: Trade[] | null;
    user_broker_account: UserBrokerAccountSearchValue | null;
    journal_content: Content | undefined;
    tags: Tag[];
    is_duplicate: boolean;
}

interface GeneralStats {
    // --- Core ---
    net_pnl: DecimalString;
    gross_pnl: DecimalString;
    charges: DecimalString;

    // --- Performance ---
    win_rate: number;
    loss_rate: number;

    profit_factor: DecimalString;
    expectancy: DecimalString;
    avg_win_loss_ratio: DecimalString;

    // --- Win / Loss Stats ---
    avg_win: DecimalString;
    avg_loss: DecimalString;
    max_win: DecimalString;
    max_loss: DecimalString;

    total_net_win_amount: DecimalString;
    total_net_loss_amount: DecimalString;

    // --- R Metrics ---
    gross_r_factor: DecimalString;
    net_r_factor: DecimalString;
    avg_r_factor: DecimalString;
    avg_gross_r_factor: DecimalString;

    avg_win_r_factor: DecimalString;
    avg_loss_r_factor: DecimalString;

    // --- ROI ---
    avg_win_roi: string;
    avg_loss_roi: string;

    // --- Streaks ---
    win_streak: number;
    loss_streak: number;

    // --- Counts ---
    total_trades_count: number;
    wins_count: number;
    losses_count: number;
    breakevens_count: number;
}

export { positionInstrumentToString, positionDirectionToString, positionStatusToString };

export type {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
    UserBrokerAccountSearchValue,
    GeneralStats,
};
