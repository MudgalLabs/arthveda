import { client, ApiRes } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";
import { PnLBucket } from "@/lib/api/dashboard";

export interface AnalyticsTagsSummaryItem {
    tag_group: string;
    tag_name: string;
    gross_pnl: string;
    net_pnl: string;
    charges: string;
    positions_count: number;
    r_factor: string;
}

export interface AnalyticsTagsSummaryGroup {
    tag_group: string;
    tags: AnalyticsTagsSummaryItem[];
}

export interface AnalyticsTagsPnLByTaItem {
    tag_group: string;
    tag_name: string;
    buckets: PnLBucket[];
}

export interface AnalyticsTagsCumulativePnLByTagGroupItem {
    tag_group: string;
    tags: AnalyticsTagsPnLByTaItem[];
}

export interface GetAnalyticsTagsResponse {
    summary: AnalyticsTagsSummaryItem[];
    summary_group: AnalyticsTagsSummaryGroup[];
    cumulative_pnl_by_tag_group: AnalyticsTagsCumulativePnLByTagGroupItem[];
}

export function getAnalyticsTags() {
    return client.get<ApiRes<GetAnalyticsTagsResponse>>(API_ROUTES.analytics.tags);
}
