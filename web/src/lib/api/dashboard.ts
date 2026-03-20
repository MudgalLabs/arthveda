import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DateRangeFilter, DecimalString } from "@/lib/types";

export interface GeneralStats {
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

export interface PnLBucket {
    label: string;
    start: string;
    end: string;
    net_pnl: DecimalString;
    gross_pnl: DecimalString;
    charges: DecimalString;
}

export interface GetDashboardRequest {
    date_range?: DateRangeFilter;
}

export interface GetDashboardResponse extends GeneralStats {
    positions_count: number;
    cumulative_pnl_buckets: PnLBucket[];
    pnl_buckets: PnLBucket[];
    no_of_positions_hidden: number;
}

export function get(body: GetDashboardRequest) {
    return client.post(API_ROUTES.dashboard.get, body);
}
