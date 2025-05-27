import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { Broker } from "@/lib/api/broker";

export function useList() {
    return useQuery({
        queryKey: ["useBrokerList"],
        queryFn: () => api.broker.list(),
        select: (res) => res.data as ApiRes<Broker[]>,
        staleTime: Infinity,
    });
}
