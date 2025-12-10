import { AnyUseQueryOptions, useQuery, UseQueryResult } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { GetCalendarAllResponse, GetCalendarDayResponse } from "@/lib/api/calendar";

export function useGetCalendarAll(): UseQueryResult<GetCalendarAllResponse, Error> {
    return useQuery({
        queryKey: ["useGetCalendar"],
        queryFn: () => api.calendar.getAll(),
        select: (res) => res.data.data as GetCalendarAllResponse,
        // We will manually invalidate this cache if user creates/updates/deletes any position(s).
        // This query's key should be in `QueriesToInvalidateOnPositionChange`.
        staleTime: Infinity,
    });
}

export function useGetCalendarDay(
    date: Date,
    options: Omit<AnyUseQueryOptions, "queryKey"> = {}
): UseQueryResult<GetCalendarDayResponse, Error> {
    return useQuery({
        queryKey: ["useGetCalendarDay", date],
        queryFn: () => api.calendar.getDay(date),
        select: (res) => res.data.data as GetCalendarDayResponse,
        // We will manually invalidate this cache if user creates/updates/deletes any position(s).
        // This query's key should be in `QueriesToInvalidateOnPositionChange`.
        staleTime: Infinity,
        ...options,
    });
}
