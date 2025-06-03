import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { GetDashboardResponse } from "@/lib/api/dashboard";

export function useGet() {
    return useQuery({
        queryKey: ["useGetDashboard"],
        queryFn: () => api.dashboard.get(),
        select: (res) => res.data.data as GetDashboardResponse,
        // We will manually invalidate this cache if user creates/updates/deletes any position(s).
        staleTime: Infinity,
    });
}
