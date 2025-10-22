import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GetAnalyticsTagsResponse } from "@/lib/api/analytics";
import { ApiRes } from "@/lib/api/client";

export function useGetAnalyticsTags() {
    return useQuery({
        queryKey: ["useGetAnalyticsTags"],
        queryFn: () => api.analytics.getAnalyticsTags(),
        select: (res) => res.data as ApiRes<GetAnalyticsTagsResponse>,
    });
}
