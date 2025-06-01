import { create } from "zustand";

import {
    DataTableState,
    dataTableStateSaveFn,
    DEFAULT_DATA_TABLE_STATE,
} from "@/s8ly/data_table/data_table_state";
import { ROUTES } from "@/routes_constants";
import {
    loadFromLocalStorage,
    loadFromURL,
    saveToLocalStorage,
    saveToURL,
} from "@/lib/utils";
import {
    defaultPositionSearchFilters,
    URL_KEY_FILTERS,
} from "@/features/position/utils";
import { PositionSearchFilters } from "@/lib/api/position";

interface ListPositionsStore {
    tableState: DataTableState;
    setTableState: (state: DataTableState) => void;
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

export const useListPositionsStore = create<ListPositionsStore>((set, get) => ({
    tableState:
        loadFromLocalStorage(ROUTES.positionList) ?? DEFAULT_DATA_TABLE_STATE,

    setTableState: (state) => {
        saveToLocalStorage(
            ROUTES.positionList,
            JSON.stringify(dataTableStateSaveFn(state))
        );
        set({ tableState: state });
    },

    filters: loadFromURL(URL_KEY_FILTERS, defaultPositionSearchFilters),

    appliedFilters: loadFromURL(URL_KEY_FILTERS, defaultPositionSearchFilters),

    updateFilter: (key, value) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [key]: value,
            },
        })),

    resetFilter: (key) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [key]: defaultPositionSearchFilters[key],
            },
            appliedFilters: {
                ...state.appliedFilters,
                [key]: defaultPositionSearchFilters[key],
            },
        })),

    resetFilters: () =>
        set({
            filters: defaultPositionSearchFilters,
            appliedFilters: defaultPositionSearchFilters,
        }),

    applyFilters: () => {
        set((state) => ({
            appliedFilters: { ...state.filters },
        }));
        saveToURL(URL_KEY_FILTERS, get().appliedFilters);
    },
}));
