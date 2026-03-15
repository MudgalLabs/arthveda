import { client, ApiRes } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";
import { GeneralStats, PnLBucket } from "@/lib/api/dashboard";

export interface AnalyticsTagsSummaryItem extends GeneralStats {
    tag_group: string;
    tag_name: string;
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

export interface AnalyticsTimeDayOfTheWeekItem {
    day: string; // `mon, `tue`, ... `sun`.
    positions_count: number;
    gross_pnl: string;
    charges: string;
    net_pnl: string;
    gross_r_factor: string;
}

export interface AnalyticsTimeHourOfTheDayItem {
    hour: string; // `00_01` , `01_02`, `23_24`.
    positions_count: number;
    gross_pnl: string;
    charges: string;
    net_pnl: string;
    gross_r_factor: string;
}

export interface GetAnalyticsTimeResponse {
    day_of_the_week: AnalyticsTimeDayOfTheWeekItem[];
    hour_of_the_day: AnalyticsTimeHourOfTheDayItem[];
}

export function getAnalyticsTime() {
    return client.get<ApiRes<GetAnalyticsTimeResponse>>(API_ROUTES.analytics.time);
}
