import {
    createContext,
    FC,
    ReactNode,
    useContext,
    useMemo,
    useCallback,
    useState,
} from "react";
import { UseQueryResult } from "@tanstack/react-query";

import { apiHooks } from "@/hooks/api_hooks";
import { ApiRes } from "@/lib/api/client";
import {
    PositionSearchFilters,
    PositionSearchResponse,
} from "@/lib/api/position";
import { apiErrorHandler } from "@/lib/api";
import { useURLState } from "@/hooks/use_url_state";
import { useEffectOnce } from "@/hooks/use_effect_once";
import {
    defaultPositionSearchFilters,
    prepareFilters,
    URL_KEY_FILTERS,
} from "@/features/position/utils";
import { useListPositionsStore } from "@/features/position/list/list_positions_store";

// TODO: Refactor the filters and everything regarding them to use
// a more generic approach so that we can reuse it in other places.

interface ListPositionsContextType {
    queryResult: UseQueryResult<ApiRes<PositionSearchResponse>, Error>;
    // tableState: DataTableState;
    // setTableState: React.Dispatch<React.SetStateAction<DataTableState>>;
    filters: PositionSearchFilters;
    appliedFilters: PositionSearchFilters;
    updateFilter: <K extends keyof PositionSearchFilters>(
        key: K,
        value: PositionSearchFilters[K]
    ) => void;
    resetFilter: <K extends keyof PositionSearchFilters>(key: K) => void;
    resetFilters: () => void;
    applyFilters: () => void;
}

const ListPositionsContext = createContext<ListPositionsContextType>(
    {} as ListPositionsContextType
);

export const ListPositionContextProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const tableState = useListPositionsStore((s) => s.tableState);

    const [appliedFilters, setAppliedFilters] =
        useURLState<PositionSearchFilters>(
            URL_KEY_FILTERS,
            defaultPositionSearchFilters
        );

    // We keep local state of filters and only update the `searchFilters`
    // when user clicks on the `Search` button.
    const [filters, setFilters] = useState(appliedFilters);

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

    const updateFilter = useCallback(
        <K extends keyof PositionSearchFilters>(
            key: K,
            value: PositionSearchFilters[K]
        ) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
            }));
        },
        [setFilters]
    );

    const resetFilter = useCallback(
        <K extends keyof PositionSearchFilters>(key: K) => {
            setFilters((prev) => ({
                ...prev,
                [key]: defaultPositionSearchFilters[key],
            }));
            setAppliedFilters((prev) => ({
                ...prev,
                [key]: defaultPositionSearchFilters[key],
            }));
        },
        []
    );

    const resetFilters = useCallback(() => {
        setFilters(defaultPositionSearchFilters);
        setAppliedFilters(defaultPositionSearchFilters);
    }, []);

    const applyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);

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
            filters,
            appliedFilters,
            updateFilter,
            resetFilter,
            resetFilters,
            applyFilters,
        }),
        [
            queryResult,
            filters,
            appliedFilters,
            updateFilter,
            resetFilter,
            resetFilters,
            applyFilters,
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
