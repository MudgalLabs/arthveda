import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GetAnalyticsSymbolsResponse, GetAnalyticsTagsResponse, GetAnalyticsTimeResponse } from "@/lib/api/analytics";
import { ApiRes } from "@/lib/api/client";

export function useGetAnalyticsTags() {
    return useQuery({
        queryKey: ["useGetAnalyticsTags"],
        queryFn: () => api.analytics.getAnalyticsTags(),
        select: (res) => res.data as ApiRes<GetAnalyticsTagsResponse>,
    });
}

export function useGetAnalyticsTime() {
    return useQuery({
        queryKey: ["useGetAnalyticsTime"],
        queryFn: () => api.analytics.getAnalyticsTime(),
        select: (res) => res.data as ApiRes<GetAnalyticsTimeResponse>,
    });
}

export function useGetAnalyticsSymbols() {
    return useQuery({
        queryKey: ["useGetAnalyticSymbols"],
        queryFn: () => api.analytics.getAnalyticsSymbols(),
        select: (res) => res.data as ApiRes<GetAnalyticsSymbolsResponse>,
    });
}
