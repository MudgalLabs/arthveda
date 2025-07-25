import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { GetDashboardRequest, GetDashboardResponse } from "@/lib/api/dashboard";

export function useGetDashboard(body: GetDashboardRequest) {
    return useQuery({
        queryKey: ["useGetDashboard", body],
        queryFn: () => api.dashboard.get(body),
        select: (res) => res.data.data as GetDashboardResponse,
        // We will manually invalidate this cache if user creates/updates/deletes any position(s).
        staleTime: Infinity,
    });
}
