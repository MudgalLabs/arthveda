import {
    PaginationState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";

export interface DataTableState {
    columnVisibility: VisibilityState;
    sorting: SortingState;
    pagination: PaginationState;
}

export const DEFAULT_DATA_TABLE_STATE: DataTableState = {
    columnVisibility: {},
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    sorting: [],
};

export function dataTableStateSaveFn(
    state: DataTableState
): Partial<DataTableState> {
    return {
        ...state,
        pagination: {
            ...state.pagination,
            // We don't want to persist pageIndex in LocalStorage.
            // TODO: We will persist pageSize, pageIndex in URL only.
            pageIndex: 0,
        },
    };
}
