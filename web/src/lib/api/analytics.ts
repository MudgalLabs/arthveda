import { client, ApiRes } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";

export interface AnalyticsTagsSummaryItem {
    tag_group: string;
    tag_name: string;
    gross_pnl: string;
    net_pnl: string;
    charges: string;
    positions_count: number;
    r_factor: string;
}

export interface GetAnalyticsTagsResponse {
    summary: AnalyticsTagsSummaryItem[];
}

export function getAnalyticsTags() {
    return client.get<ApiRes<GetAnalyticsTagsResponse>>(API_ROUTES.analytics.tags);
}
