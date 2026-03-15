import { useEffect, useState } from "react";

import {
    ColumnDef,
    PaginationState,
    Row,
    SortingState,
    Table,
    VisibilityState,
    getCoreRowModel,
    getExpandedRowModel,
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
    getRowCanExpand?: (row: Row<TData>) => boolean;
    manualSorting?: boolean;
    manualPagination?: boolean;
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
    getRowCanExpand,
    manualSorting = false,
    manualPagination = false,
}: DataTableSmartProps<TData, TValue>) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => stateProp?.columnVisibility ?? {});
    const [pagination, setPagination] = useState<PaginationState>(
        () => stateProp?.pagination ?? { pageIndex: 0, pageSize: 10 }
    );
    const [sorting, setSorting] = useState<SortingState>(stateProp?.sorting ?? []);
    const [rowSelection, setRowSelection] = useState({});

    if (manualPagination && total === undefined) {
        throw new Error("DataTableSmart: manualPagination requires total");
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

        manualPagination,
        manualSorting,

        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableSortingRemoval: true,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,

        getCoreRowModel: getCoreRowModel(),

        getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
        getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),

        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand,

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
