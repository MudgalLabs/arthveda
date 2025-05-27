import {
    createContext,
    FC,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
} from "react";
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
import { useEffectOnce } from "@/hooks/use_effect_once";
import { CompareOperator } from "@/components/select/compare_select";

const defaultPositionSearchFilters: PositionSearchFilters = {
    opened: {},
    symbol: "",
    instrument: "",
    direction: "",
    status: "all",
    r_factor: "",
    r_factor_operator: CompareOperator.GTE,
    gross_pnl: "",
    gross_pnl_operator: CompareOperator.GTE,
    net_pnl: "",
    net_pnl_operator: CompareOperator.GTE,
    net_return_percentage: "",
    net_return_percentage_operator: CompareOperator.GTE,
    charges_percentage: "",
    charges_percentage_operator: CompareOperator.GTE,
};

function prepareFilters(filters: PositionSearchFilters): PositionSearchFilters {
    // Remove filter if it's empty because the client expects a number.
    // Empty means don't apply this filter.

    if (filters.r_factor === "") {
        delete filters.r_factor;
    }

    if (filters.net_return_percentage === "") {
        delete filters.net_return_percentage;
    }

    if (filters.charges_percentage === "") {
        delete filters.charges_percentage;
    }
    return filters;
}

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
            "filters",
            defaultPositionSearchFilters
        );

    const queryResult = apiHooks.position.useSearch({
        filters: prepareFilters(searchFilters),
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
