import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { Currency } from "@/lib/api/currency";

export function useList() {
    return useQuery({
        queryKey: ["useCurrencyList"],
        queryFn: () => api.currency.list(),
        select: (res) => res.data as ApiRes<Currency[]>,
        // We are sure currencies won't change during runtime. If we were to
        // allow uers to change currenceis (default/preference etc) then
        // we can invalidate this query later.
        staleTime: Infinity,
    });
}
