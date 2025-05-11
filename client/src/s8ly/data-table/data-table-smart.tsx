import { useState } from "react";

import {
    ColumnDef,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTable } from "./data-table";
import { DataTableVisibility } from "./data-table-visibility";

interface DataTableSmartProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function DataTableSmart<TData, TValue>({
    columns,
    data,
}: DataTableSmartProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className="w-300 space-y-4">
            <div className="flex justify-end">
                <DataTableVisibility table={table} />
            </div>

            <DataTable table={table} />

            <DataTablePagination table={table} showRowSelection />
        </div>
    );
}

export { DataTableSmart };
export type { DataTableSmartProps };
