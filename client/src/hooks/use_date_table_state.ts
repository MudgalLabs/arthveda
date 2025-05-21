import { DataTableState } from "@/s8ly/data_table/data_table_smart";
import { useLocalStorageState } from "@/hooks/use_local_storage_state";

const _defaultValue: DataTableState = {
    columnVisibility: {},
    pagination: {
        pageIndex: 0,
        pageSize: 10,
    },
    sorting: [],
};

// Create state for DataTable so that we can initialize it with
// previously set sorting and column visibility. Right now it is
// wrapping `useLocalStorateState` so that we can later add logic
// coupled to DataTableState.
export function useDataTableState(
    key: string,
    defaultValue?: DataTableState
): [DataTableState, React.Dispatch<React.SetStateAction<DataTableState>>] {
    const [state, setState] = useLocalStorageState<DataTableState>(
        key,
        defaultValue ?? _defaultValue,
        {
            saveFn: (state) => ({
                ...state,
                pagination: {
                    ...state.pagination,
                    // We don't want to persist pageIndex in LocalStorage.
                    // TODO: We will persist pageSize, pageIndex in URL only.
                    pageIndex: 0,
                },
            }),
        }
    );

    return [state, setState];
}
