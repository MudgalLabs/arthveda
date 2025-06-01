import { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { UseQueryResult } from "@tanstack/react-query";

import { apiHooks } from "@/hooks/api_hooks";
import { ApiRes } from "@/lib/api/client";
import { PositionSearchResponse } from "@/lib/api/position";
import { apiErrorHandler } from "@/lib/api";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { prepareFilters } from "@/features/position/utils";
import { useListPositionsStore } from "@/features/position/list/list_positions_store";

// TODO: Refactor the filters and everything regarding them to use
// a more generic approach so that we can reuse it in other places.

interface ListPositionsContextType {
    queryResult: UseQueryResult<ApiRes<PositionSearchResponse>, Error>;
}

const ListPositionsContext = createContext<ListPositionsContextType>(
    {} as ListPositionsContextType
);

export const ListPositionContextProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const tableState = useListPositionsStore((s) => s.tableState);
    const appliedFilters = useListPositionsStore((s) => s.appliedFilters);

    const queryResult = apiHooks.position.useSearch({
        filters: prepareFilters(appliedFilters),
        pagination: {
            page: tableState.pagination.pageIndex + 1,
            limit: tableState.pagination.pageSize,
        },
        sort:
            tableState.sorting.length === 1
                ? {
                      field: tableState.sorting[0].id,
                      order: tableState.sorting[0].desc ? "desc" : "asc",
                  }
                : undefined,
    });

    useEffectOnce(
        (deps) => {
            if (deps.queryResult.isError) {
                apiErrorHandler(queryResult.error);
            }
        },
        { queryResult },
        (deps) => deps.queryResult.isError
    );

    const value = useMemo(
        () => ({
            queryResult,
        }),
        [queryResult]
    );

    return (
        <ListPositionsContext.Provider value={value}>
            {children}
        </ListPositionsContext.Provider>
    );
};

export const useListPositions = () => {
    const context = useContext(ListPositionsContext);

    if (!context) {
        throw new Error(
            "useListPositions: did you forget to use ListPositionContextProvider?"
        );
    }

    return context;
};
