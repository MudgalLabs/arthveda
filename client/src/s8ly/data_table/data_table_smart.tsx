import { useEffect, useState } from "react";

import {
    ColumnDef,
    PaginationState,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "@/s8ly/data_table/data_table_pagination";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableVisibility } from "@/s8ly/data_table/data_table_visibility";

interface DataTableState {
    columnVisibility: VisibilityState;
    sorting: SortingState;
    pagination: PaginationState;
}

interface DataTableSmartProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    total?: number;
    state?: Partial<DataTableState>;
    onStateChange?: (newState: DataTableState) => void;
    isFetching?: boolean;
}

function DataTableSmart<TData, TValue>({
    columns,
    data,
    total,
    state: stateProp,
    onStateChange,
    isFetching,
}: DataTableSmartProps<TData, TValue>) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        () => stateProp?.columnVisibility ?? {}
    );
    const [pagination, setPagination] = useState<PaginationState>(
        () => stateProp?.pagination ?? { pageIndex: 0, pageSize: 10 }
    );
    const [sorting, setSorting] = useState<SortingState>(
        stateProp?.sorting ?? []
    );
    const [rowSelection, setRowSelection] = useState({});

    if (stateProp?.pagination && total === undefined) {
        throw new Error(
            "DataTableSmart: you provided `state.pagination` but no `total`"
        );
    }

    useEffect(() => {
        console.log("Data is updated in DataTableSmart", data);
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        state: {
            columnVisibility,
            rowSelection,
            sorting,
            pagination,
        },
        rowCount: total,
        manualPagination: !!stateProp?.pagination, // Controlled if pagination state is provided
        manualSorting: !!stateProp?.sorting, // Controlled if sorting state is provided
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: !stateProp?.pagination
            ? getPaginationRowModel()
            : undefined, // Use client-side pagination if uncontrolled
        getSortedRowModel: !stateProp?.sorting
            ? getSortedRowModel()
            : undefined, // Use client-side sorting if uncontrolled
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        meta: {
            isFetching,
        },
    });

    const tableState = table.getState();
    useEffect(() => {
        const newState: DataTableState = {
            columnVisibility: tableState.columnVisibility,
            sorting: tableState.sorting,
            pagination: tableState.pagination,
        };
        // Ensure onStateChange is called even if sorting toggles on the same column
        onStateChange?.(newState);
    }, [
        tableState.sorting, // Trigger effect on sorting changes
        tableState.columnVisibility,
        tableState.pagination,
        onStateChange, // Include onStateChange in dependencies
    ]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <DataTableVisibility table={table} />
            </div>

            <DataTable table={table} />

            <DataTablePagination table={table} total={total} />
        </div>
    );
}

export { DataTableSmart };
export type { DataTableSmartProps, DataTableState };
