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
import {
    CompareOperator,
    compareOperatorToString,
} from "@/components/select/compare_select";
import { formatDate } from "@/lib/utils";
import {
    positionDirectionToString,
    positionInstrumentToString,
    positionStatusToString,
} from "@/features/position/position";

// TODO: Refactor the filters and everything regarding them to use
// a more generic approach so that we can reuse it in other places.

export const defaultPositionSearchFilters: PositionSearchFilters = {
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

export const positionSearchFiltersLabel: Partial<
    Record<keyof PositionSearchFilters, string>
> = {
    opened: "Opened",
    symbol: "Symbol",
    instrument: "Instrument",
    direction: "Direction",
    status: "Status",
    r_factor: "R Factor",
    gross_pnl: "Gross PnL",
    net_pnl: "Net PnL",
    net_return_percentage: "Net Return %",
    charges_percentage: "Charges %",
};

export const positionSearchFiltersValueFormatter: Partial<
    Record<
        keyof PositionSearchFilters,
        (value: any, filters: PositionSearchFilters) => string
    >
> = {
    opened: (v) => {
        if (!v?.from && !v?.to) return "Any";
        const from = v.from ? formatDate(new Date(v.from)) : "Any";
        const to = v.to ? formatDate(new Date(v.to)) : "Any";
        return `${from} - ${to}`;
    },
    symbol: (v) => String(v).toUpperCase(),
    instrument: (v) => positionInstrumentToString(v),
    direction: (v) => positionDirectionToString(v),
    status: (v) => positionStatusToString(v),
    r_factor: (v, filters) => {
        if (v === "" || !filters.r_factor_operator) return "Any";
        return `${compareOperatorToString(filters.r_factor_operator)} ${v}`;
    },
    gross_pnl: (v, filters) => {
        if (v === "" || !filters.gross_pnl_operator) return "Any";
        return `${compareOperatorToString(filters.gross_pnl_operator)} ${v}`;
    },
    net_pnl: (v, filters) => {
        if (v === "" || !filters.net_pnl_operator) return "Any";
        return `${compareOperatorToString(filters.net_pnl_operator)} ${v}`;
    },
    net_return_percentage: (v, filters) => {
        if (v === "" || !filters.net_return_percentage_operator) return "Any";
        return `${compareOperatorToString(filters.net_return_percentage_operator)} ${v}%`;
    },
    charges_percentage: (v, filters) => {
        if (v === "" || !filters.charges_percentage_operator) return "Any";
        return `${compareOperatorToString(filters.charges_percentage_operator)} ${v}%`;
    },
};

function prepareFilters(filters: PositionSearchFilters): PositionSearchFilters {
    if (filters.gross_pnl) {
        filters.gross_pnl = String(filters.gross_pnl);
    }

    if (filters.net_pnl) {
        filters.net_pnl = String(filters.net_pnl);
    }

    if (filters.r_factor) {
        filters.r_factor = String(filters.r_factor);
    }

    if (filters.charges_percentage) {
        filters.charges_percentage = String(filters.charges_percentage);
    }

    if (filters.net_return_percentage) {
        filters.net_return_percentage = String(filters.net_return_percentage);
    }

    //
    // Remove filter if it's empty because the client expects a number.
    // Empty means don't apply this filter.
    //
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

const URL_KEY_FILTERS = "filters";

function getFiltersParser(): Record<string, (value: any) => string> {
    const parser: Partial<
        Record<keyof PositionSearchFilters, (value: any) => any>
    > = {
        gross_pnl: String,
        net_pnl: String,
        r_factor: String,
    };

    const finalParser: Record<string, (value: any) => any> = {};

    // I know this looks scary because of typing but all that I am doing here
    // is appending "filter.<filter>" to match qs dot method.
    Object.keys(parser).forEach((key) => {
        finalParser[`${URL_KEY_FILTERS}.${key}`] =
            parser[key as keyof PositionSearchFilters] ||
            ((value: any) => value);
    });

    return finalParser;
}

interface ListPositionsContextType {
    queryResult: UseQueryResult<ApiRes<PositionSearchResponse>, Error>;
    tableState: DataTableState;
    setTableState: React.Dispatch<React.SetStateAction<DataTableState>>;
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
    const [tableState, setTableState] = useDataTableState(ROUTES.positionList);
    const [appliedFilters, setAppliedFilters] =
        useURLState<PositionSearchFilters>(
            URL_KEY_FILTERS,
            defaultPositionSearchFilters,
            getFiltersParser()
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
            tableState,
            setTableState,
            filters,
            appliedFilters,
            updateFilter,
            resetFilter,
            resetFilters,
            applyFilters,
        }),
        [
            queryResult,
            tableState,
            setTableState,
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
