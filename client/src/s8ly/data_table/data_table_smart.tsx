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

import { DataTablePagination } from "./data_table_pagination";
import { DataTable } from "./data_table";
import { DataTableVisibility } from "./data_table_visibility";

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
        manualPagination:
            stateProp?.pagination === undefined && total ? true : false,
        manualSorting: stateProp?.sorting === undefined,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
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
        onStateChange?.(newState);
    }, [
        tableState.sorting,
        tableState.columnVisibility,
        tableState.pagination,
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
