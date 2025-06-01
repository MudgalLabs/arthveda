import { create } from "zustand";

import {
    DataTableState,
    DEFAULT_DATA_TABLE_STATE,
} from "@/s8ly/data_table/data_table_state";
import { ROUTES } from "@/routes_constants";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils";

interface ListPositionsStore {
    tableState: DataTableState;
    setTableState: (state: DataTableState) => void;
}

export const useListPositionsStore = create<ListPositionsStore>((set) => ({
    tableState:
        loadFromLocalStorage(ROUTES.positionList) ?? DEFAULT_DATA_TABLE_STATE,
    setTableState: (state) => {
        saveToLocalStorage(ROUTES.positionList, JSON.stringify(state));
        set({ tableState: state });
    },
}));
