import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const QUERY_KEYS = {
    useGetInsights: ["useGetInsights"],
};

export function useGetInsights() {
    return useQuery({
        queryKey: QUERY_KEYS.useGetInsights,
        queryFn: async () => {
            const res = await api.insight.get();
            return res.data.data;
        },
    });
}
