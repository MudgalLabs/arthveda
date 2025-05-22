import { createContext, FC, ReactNode, useContext, useMemo } from "react";

import { apiHooks } from "@/hooks/api_hooks";
import { useDataTableState } from "@/hooks/use_date_table_state";
import { ApiRes } from "@/lib/api/client";
import { PositionSearchResponse } from "@/lib/api/position";
import { ROUTES } from "@/routes";
import { DataTableState } from "@/s8ly/data_table/data_table_smart";
import { UseQueryResult } from "@tanstack/react-query";
import { apiErrorHandler } from "@/lib/api";

export { ListPositionContextProvider, useListPositions };

interface ListPositionsContextType {
    queryResult: UseQueryResult<ApiRes<PositionSearchResponse>, Error>;
    state: DataTableState;
    setState: React.Dispatch<React.SetStateAction<DataTableState>>;
}

const ListPositionsContext = createContext<ListPositionsContextType>(
    {} as ListPositionsContextType
);

const ListPositionContextProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [state, setState] = useDataTableState(ROUTES.positionList);

    const queryResult = apiHooks.position.useSearch({
        filters: {},
        pagination: {
            page: state.pagination.pageIndex + 1,
            limit: state.pagination.pageSize,
        },
        sort:
            state.sorting.length === 1
                ? {
                      field: state.sorting[0].id,
                      order: state.sorting[0].desc ? "desc" : "asc",
                  }
                : undefined,
    });

    if (queryResult.isError) {
        apiErrorHandler(queryResult.error);
    }

    const value = useMemo(
        () => ({
            queryResult,
            state,
            setState,
        }),
        [queryResult, state, setState]
    );

    return (
        <ListPositionsContext.Provider value={value}>
            {children}
        </ListPositionsContext.Provider>
    );
};

const useListPositions = () => {
    const context = useContext(ListPositionsContext);

    if (!context) {
        throw new Error(
            "useListPositions: did you forget to use ListPositionContextProvider?"
        );
    }

    return context;
};
