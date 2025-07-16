import { create } from "zustand";
import { DEFAULT_DATA_TABLE_STATE, DataTableState, dataTableStateSaveFn } from "@/s8ly/data_table/data_table_state";
import { ROUTES } from "@/constants";
import { loadFromLocalStorage, loadFromURL, saveToLocalStorage, saveToURL } from "@/lib/utils";
import { defaultPositionSearchFilters, URL_KEY_FILTERS } from "@/features/position/utils";
import { PositionSearchFilters } from "@/lib/api/position";

interface ListPositionsStore extends PositionSearchFilters {
    tableState: DataTableState;
    appliedFilters: PositionSearchFilters;

    setTableState: (state: DataTableState) => void;
    updateFilter: <K extends keyof PositionSearchFilters>(key: K, value: PositionSearchFilters[K]) => void;
    resetFilter: <K extends keyof PositionSearchFilters>(key: K) => void;
    resetFilters: () => void;
    applyFilters: () => void;
}

const initial = loadFromURL(URL_KEY_FILTERS, defaultPositionSearchFilters);

export const useListPositionsStore = create<ListPositionsStore>((set, get) => ({
    ...initial,

    tableState: loadFromLocalStorage(ROUTES.explorePositions) ?? DEFAULT_DATA_TABLE_STATE,

    appliedFilters: { ...initial },

    setTableState: (state) => {
        saveToLocalStorage(ROUTES.explorePositions, JSON.stringify(dataTableStateSaveFn(state)));
        set({ tableState: state });
    },

    updateFilter: (key, value) => set({ [key]: value }),

    resetFilter: (key) => {
        set({
            [key]: defaultPositionSearchFilters[key],
            appliedFilters: {
                ...get().appliedFilters,
                [key]: defaultPositionSearchFilters[key],
            },
        });

        get().applyFilters();
    },

    resetFilters: () => {
        const resets = { ...defaultPositionSearchFilters };
        const flatResets = Object.fromEntries(Object.entries(resets)) as Partial<ListPositionsStore>;

        set({
            ...flatResets,
            appliedFilters: resets,
        });
        get().applyFilters();
    },

    applyFilters: () => {
        const applied: PositionSearchFilters = Object.fromEntries(
            Object.keys(defaultPositionSearchFilters).map((key) => [key, get()[key as keyof PositionSearchFilters]])
        ) as PositionSearchFilters;

        set({ appliedFilters: applied });
        saveToURL(URL_KEY_FILTERS, applied);
    },
}));
