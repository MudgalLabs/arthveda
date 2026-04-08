import { ApiRes, client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";

export type InsightTokenType = "currency" | "percentage" | "text";
export type InsightTone = "positive" | "negative" | "neutral";

export interface InsightToken {
    value: number | string;
    type: InsightTokenType;
    tone: InsightTone;
}

export interface Insight {
    type: string;
    direction: "positive" | "negative";

    title: string;
    description: string;

    tokens: Record<string, InsightToken>;

    action: string;
    meta?: Record<string, any>;
}

export interface InsightSection {
    key: string;
    title: string;
    description: string;
    insights: Insight[];
}

export interface GetInsightsResponse {
    sections: InsightSection[];
}

export function get() {
    return client.get<ApiRes<GetInsightsResponse>>(API_ROUTES.insight.get);
}
