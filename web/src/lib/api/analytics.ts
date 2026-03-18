import { client, ApiRes } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";
import { GeneralStats, PnLBucket } from "@/lib/api/dashboard";
import { DecimalString } from "../types";

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

export interface AnalyticsTimeHoldingPeriodItem {
    period: string; // `under_1m`, `1_5m`, ... `over_365d`
    positions_count: number;
    gross_pnl: string;
    charges: string;
    net_pnl: string;
    gross_r_factor: string;
}

export interface GetAnalyticsTimeResponse {
    day_of_the_week: AnalyticsTimeDayOfTheWeekItem[];
    hour_of_the_day: AnalyticsTimeHourOfTheDayItem[];
    holding_period: AnalyticsTimeHoldingPeriodItem[];
}

export function getAnalyticsTime() {
    return client.get<ApiRes<GetAnalyticsTimeResponse>>(API_ROUTES.analytics.time);
}

export interface SymbolsPerformanceItem {
    symbol: string;
    positions_count: number;
    contribution_percentage: number;
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    charges: DecimalString;
    avg_gross_r: DecimalString;
    avg_win_r: DecimalString;
    avg_loss_r: DecimalString;
    win_rate: DecimalString;
    efficiency: DecimalString;
}

export interface GetAnalyticsSymbolsResponse {
    best_performance: SymbolsPerformanceItem[];
    worst_performance: SymbolsPerformanceItem[];
    top_traded: SymbolsPerformanceItem[];
}

export function getAnalyticsSymbols() {
    return client.get<ApiRes<GetAnalyticsSymbolsResponse>>(API_ROUTES.analytics.symbols);
}
