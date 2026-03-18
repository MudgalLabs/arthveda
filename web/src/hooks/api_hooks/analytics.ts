import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    GetAnalyticsInstrumentsResponse,
    GetAnalyticsSymbolsResponse,
    GetAnalyticsTagsResponse,
    GetAnalyticsTimeframesResponse,
} from "@/lib/api/analytics";
import { ApiRes } from "@/lib/api/client";

export function useGetAnalyticsTags() {
    return useQuery({
        queryKey: ["useGetAnalyticsTags"],
        queryFn: () => api.analytics.getAnalyticsTags(),
        select: (res) => res.data as ApiRes<GetAnalyticsTagsResponse>,
    });
}

export function useGetAnalyticsTimeframes() {
    return useQuery({
        queryKey: ["useGetAnalyticsTime"],
        queryFn: () => api.analytics.getAnalyticsTimeframes(),
        select: (res) => res.data as ApiRes<GetAnalyticsTimeframesResponse>,
    });
}

export function useGetAnalyticsSymbols() {
    return useQuery({
        queryKey: ["useGetAnalyticSymbols"],
        queryFn: () => api.analytics.getAnalyticsSymbols(),
        select: (res) => res.data as ApiRes<GetAnalyticsSymbolsResponse>,
    });
}

export function useGetAnalyticsInstruments() {
    return useQuery({
        queryKey: ["useGetAnalytiInstruments"],
        queryFn: () => api.analytics.getAnalyticsInstruments(),
        select: (res) => res.data as ApiRes<GetAnalyticsInstrumentsResponse>,
    });
}
