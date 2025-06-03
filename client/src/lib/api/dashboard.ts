import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DecimalString } from "@/lib/types";

interface GeneralStats {
    win_rate: number;
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    charges: DecimalString;
    avg_win_r_factor: number;
    avg_loss_r_factor: number;
    avg_win: DecimalString;
    avg_loss: DecimalString;
    max_win: DecimalString;
    max_loss: DecimalString;
    win_streak: number;
    loss_streak: number;
}

interface CumulativePnLDataItem {
    label: string;
    pnl: DecimalString;
    start: string;
    end: string;
}

export interface GetDashboardResponse extends GeneralStats {
    cumulative_pnl: CumulativePnLDataItem[];
}

export function get() {
    return client.get(API_ROUTES.dashboard.get);
}
