import { useEffect, useState } from "react";

import {
    ColumnDef,
    PaginationState,
    SortingState,
    Table,
    VisibilityState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { DataTableState } from "@/s8ly/data_table/data_table_state";

interface DataTableSmartProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    children: (table: Table<TData>) => React.ReactNode;
    total?: number;
    state?: Partial<DataTableState>;
    onStateChange?: (newState: DataTableState) => void;
    isFetching?: boolean;
    extra?: Record<string, any>;
}

function DataTableSmart<TData, TValue>({
    columns,
    data,
    children,
    total,
    state: stateProp,
    onStateChange,
    isFetching,
    extra = {},
}: DataTableSmartProps<TData, TValue>) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => stateProp?.columnVisibility ?? {});
    const [pagination, setPagination] = useState<PaginationState>(
        () => stateProp?.pagination ?? { pageIndex: 0, pageSize: 10 }
    );
    const [sorting, setSorting] = useState<SortingState>(stateProp?.sorting ?? []);
    const [rowSelection, setRowSelection] = useState({});

    if (stateProp?.pagination && total === undefined) {
        throw new Error("DataTableSmart: you provided `state.pagination` but no `total`");
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
        manualPagination: !!stateProp?.pagination, // Controlled if pagination state is provided
        manualSorting: !!stateProp?.sorting, // Controlled if sorting state is provided
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: !stateProp?.pagination ? getPaginationRowModel() : undefined, // Use client-side pagination if uncontrolled
        getSortedRowModel: !stateProp?.sorting ? getSortedRowModel() : undefined, // Use client-side sorting if uncontrolled
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        meta: {
            isFetching,
            extra,
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
    }, [tableState.sorting, tableState.columnVisibility, tableState.pagination, onStateChange]);

    return <>{children(table)}</>;
}

export { DataTableSmart };
export type { DataTableSmartProps };
