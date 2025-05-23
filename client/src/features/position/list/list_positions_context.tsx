import { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { UseQueryResult } from "@tanstack/react-query";

import { apiHooks } from "@/hooks/api_hooks";
import { useDataTableState } from "@/hooks/use_date_table_state";
import { ApiRes } from "@/lib/api/client";
import {
    PositionSearchFilters,
    PositionSearchResponse,
} from "@/lib/api/position";
import { ROUTES } from "@/routes";
import { DataTableState } from "@/s8ly/data_table/data_table_smart";
import { apiErrorHandler } from "@/lib/api";
import { useURLState } from "@/hooks/use_url_state";
import { useDebounce } from "@/hooks/use_debounce";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { CompareOperator } from "@/components/select/compare_select";

const defaultPositionSearchFilters: PositionSearchFilters = {
    opened: {},
    symbol: "",
    // instrument: "",
    // direction: "",
    // status: "",
    // r_factor: "",
    // r_factor_operator: CompareOperator.EQ,
    // gross_pnl: "",
    // gross_pnl_operator: CompareOperator.EQ,
    // net_pnl: "",
    // net_pnl_operator: CompareOperator.EQ,
    // net_return_percentage: "",
    // net_return_percentage_operator: CompareOperator.EQ,
    // charges_percentage: "",
    // charges_percentage_operator: CompareOperator.EQ,
};

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
    const tableStateDebounced = useDebounce(tableState, 500);
    const [searchFilters, setSearchFilters] =
        useURLState<PositionSearchFilters>(
            "filters",
            defaultPositionSearchFilters
        );

    const queryResult = apiHooks.position.useSearch({
        filters: searchFilters,
        pagination: {
            page: tableStateDebounced.pagination.pageIndex + 1,
            limit: tableStateDebounced.pagination.pageSize,
        },
        sort:
            tableStateDebounced.sorting.length === 1
                ? {
                      field: tableStateDebounced.sorting[0].id,
                      order: tableStateDebounced.sorting[0].desc
                          ? "desc"
                          : "asc",
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
