import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { SymbolSearchRequest, SymbolSearchResponse } from "@/lib/api/symbol";

export function useSearch(body: SymbolSearchRequest) {
    return useQuery({
        queryKey: ["useSymbolsSearch", body],
        queryFn: () => api.symbol.search(body),
        select: (res) => res.data as ApiRes<SymbolSearchResponse>,
    });
}
