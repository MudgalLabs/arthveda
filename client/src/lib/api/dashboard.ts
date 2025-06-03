import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DecimalString } from "@/lib/types";

interface CumulativePnLDataItem {
    label: string;
    pnl: DecimalString;
    start: string;
    end: string;
}

export interface GetDashboardResponse {
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    win_rate_percentage: number;
    cumulative_pnl: CumulativePnLDataItem[];
}

export function get() {
    return client.get(API_ROUTES.dashboard.get);
}
