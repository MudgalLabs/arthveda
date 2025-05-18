import { Table } from "@tanstack/react-table";

import { Button, Select } from "@/s8ly";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    /** If set to `true`, we will show how many rows are selected. @default false */
    showRowSelection?: boolean;
}

const pageSizeOptions = [10, 25, 50, 100].map((pageSize) => ({
    value: String(pageSize),
    label: String(pageSize),
}));

export function DataTablePagination<TData>({
    table,
}: DataTablePaginationProps<TData>) {
    return (
        <div className="flex items-center justify-between px-2">
            <div
                className={cn("text-muted-foreground text-sm opacity-0", {
                    "opacity-100":
                        table.getFilteredSelectedRowModel().rows.length > 0,
                })}
            >
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>

            <div className="flex gap-x-4">
                <div className="flex items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <IconChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <IconChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <IconChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                        }
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <IconChevronsRight />
                    </Button>
                </div>
                <div className="flex items-center justify-center text-sm font-medium">
                    {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    {" - "}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                            table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )}
                    {" of "}
                    {table.getFilteredRowModel().rows.length}
                </div>
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        classNames={{
                            trigger: "h-8 w-[80px]",
                            content: "w-[80px]",
                            item: "h-8",
                        }}
                        options={pageSizeOptions}
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
