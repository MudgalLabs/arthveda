import { Table } from "@tanstack/react-table";

import { Button } from "netra";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@/components/icons";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    /** Total number of rows/items. */
    total?: number;
}

const pageSizes = [10, 25, 50];

export function DataTablePagination<TData>({ table, total }: DataTablePaginationProps<TData>) {
    const pageInfo = (
        <>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </>
    );

    const rowsInfo = (
        <>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            {" - "}
            {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
            )}
            {" of "}
            {total ?? table.getFilteredRowModel().rows.length}
        </>
    );

    const selectedRowsInfo = (
        <div>
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between px-2">
                <div
                    className={cn("text-muted-foreground hidden text-sm opacity-0 sm:inline-block", {
                        "opacity-100": table.getFilteredSelectedRowModel().rows.length > 0,
                    })}
                >
                    {selectedRowsInfo}
                </div>

                <div className="flex flex-col">
                    <div className="flex gap-x-4">
                        <div className="flex items-center justify-center text-sm">{pageInfo}</div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft size="16" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft size="16" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight size="16" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight size="16" />
                            </Button>
                        </div>
                        <div className="hidden items-center justify-center text-sm sm:flex">{rowsInfo}</div>
                    </div>
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        {pageSizes.map((pageSize) => (
                            <Button
                                key={pageSize}
                                variant="ghost"
                                size="icon"
                                className={cn("text-text-muted", {
                                    "text-foreground font-semibold": table.getState().pagination.pageSize === pageSize,
                                })}
                                onClick={() => table.setPageSize(pageSize)}
                            >
                                {pageSize}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div
                className={cn("text-muted-foreground text-sm opacity-0 sm:hidden", {
                    "opacity-100": table.getFilteredSelectedRowModel().rows.length > 0,
                })}
            >
                {selectedRowsInfo}
            </div>
        </>
    );
}
