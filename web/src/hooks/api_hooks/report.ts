import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    GetAnalyticsInstrumentsResponse,
    GetAnalyticsSymbolsResponse,
    GetAnalyticsTagsResponse,
    GetAnalyticsTimeframesResponse,
} from "@/lib/api/report";
import { ApiRes } from "@/lib/api/client";

export function useGetAnalyticsTags() {
    return useQuery({
        queryKey: ["useGetAnalyticsTags"],
        queryFn: () => api.report.getAnalyticsTags(),
        select: (res) => res.data as ApiRes<GetAnalyticsTagsResponse>,
    });
}

export function useGetAnalyticsTimeframes() {
    return useQuery({
        queryKey: ["useGetAnalyticsTime"],
        queryFn: () => api.report.getAnalyticsTimeframes(),
        select: (res) => res.data as ApiRes<GetAnalyticsTimeframesResponse>,
    });
}

export function useGetAnalyticsSymbols() {
    return useQuery({
        queryKey: ["useGetAnalyticSymbols"],
        queryFn: () => api.report.getAnalyticsSymbols(),
        select: (res) => res.data as ApiRes<GetAnalyticsSymbolsResponse>,
    });
}

export function useGetAnalyticsInstruments() {
    return useQuery({
        queryKey: ["useGetAnalytiInstruments"],
        queryFn: () => api.report.getAnalyticsInstruments(),
        select: (res) => res.data as ApiRes<GetAnalyticsInstrumentsResponse>,
    });
}
