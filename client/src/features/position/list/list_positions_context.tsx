import { createContext, FC, ReactNode, useContext, useMemo } from "react";

import { apiHooks } from "@/hooks/api_hooks";
import { useDataTableState } from "@/hooks/use_date_table_state";
import { ApiRes } from "@/lib/api/client";
import {
    PositionSearchFilters,
    PositionSearchResponse,
} from "@/lib/api/position";
import { ROUTES } from "@/routes";
import { DataTableState } from "@/s8ly/data_table/data_table_smart";
import { UseQueryResult } from "@tanstack/react-query";
import { apiErrorHandler } from "@/lib/api";
import { useURLState } from "@/hooks/use_url_state";
import { useDebounce } from "@/hooks/use_debounce";

const defaultSearchFilters: PositionSearchFilters = {};

interface ListPositionsContextType {
    queryResult: UseQueryResult<ApiRes<PositionSearchResponse>, Error>;
    tableState: DataTableState;
    setTableState: React.Dispatch<React.SetStateAction<DataTableState>>;
    searchFilters: PositionSearchFilters;
    setSearchFilters: React.Dispatch<
        React.SetStateAction<PositionSearchFilters>
    >;
}

const ListPositionsContext = createContext<ListPositionsContextType>(
    {} as ListPositionsContextType
);

export const ListPositionContextProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [tableState, setTableState] = useDataTableState(ROUTES.positionList);
    const [searchFilters, setSearchFilters] =
        useURLState<PositionSearchFilters>(
            "position_list_filters",
            defaultSearchFilters
        );
    const searchFiltersDebouned = useDebounce(searchFilters, 300);

    const queryResult = apiHooks.position.useSearch({
        filters: searchFiltersDebouned,
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

    if (queryResult.isError) {
        apiErrorHandler(queryResult.error);
    }

    const value = useMemo(
        () => ({
            queryResult,
            tableState,
            setTableState,
            searchFilters,
            setSearchFilters,
        }),
        [
            queryResult,
            tableState,
            setTableState,
            searchFilters,
            setSearchFilters,
        ]
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
