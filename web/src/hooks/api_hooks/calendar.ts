import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { GetCalendarResponse } from "@/lib/api/calendar";

export function useGetCalendar() {
    return useQuery({
        queryKey: ["useGetCalendar"],
        queryFn: () => api.calendar.get(),
        select: (res) => res.data.data as GetCalendarResponse,
        // We will manually invalidate this cache if user creates/updates/deletes any position(s).
        staleTime: Infinity,
    });
}
