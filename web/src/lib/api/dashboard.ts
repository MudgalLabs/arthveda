import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DateRangeFilter, DecimalString } from "@/lib/types";

export interface GeneralStats {
    win_rate: number;
    loss_rate: number;
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    charges: DecimalString;
    avg_r_factor: DecimalString;
    avg_win_r_factor: DecimalString;
    avg_win_roi: string;
    avg_win: DecimalString;
    max_win: DecimalString;
    avg_loss_r_factor: DecimalString;
    avg_loss_roi: string;
    avg_loss: DecimalString;
    max_loss: DecimalString;
    win_streak: number;
    loss_streak: number;
    wins_count: number;
    losses_count: number;
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
