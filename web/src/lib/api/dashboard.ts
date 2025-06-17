import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DateRangeFilter, DecimalString } from "@/lib/types";

interface GeneralStats {
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    charges: DecimalString;
    win_rate: number;
    avg_win_r_factor: number;
    avg_win: DecimalString;
    max_win: DecimalString;
    win_streak: number;
    loss_rate: number;
    avg_loss_r_factor: number;
    avg_loss: DecimalString;
    max_loss: DecimalString;
    loss_streak: number;
}

interface CumulativePnLDataItem {
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
    cumulative_pnl: CumulativePnLDataItem[];
    positions_count: number;
}

export function get(body: GetDashboardRequest) {
    return client.post(API_ROUTES.dashboard.get, body);
}
