import { Fragment } from "react";
import { Cell, Row, Table as TableProp, flexRender } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "netra";

interface DataTableProps<TData> {
    table: TableProp<TData>;
    renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
    rowClassName?: (row: Row<TData>) => string;
    cellClassName?: (cell: Cell<TData, unknown>) => string;
    tableClassName?: string;
}

function DataTable<TData>({
    table,
    renderSubComponent,
    rowClassName,
    cellClassName,
    tableClassName,
}: DataTableProps<TData>) {
    return (
        <div>
            <Table className={tableClassName}>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} colSpan={header.colSpan}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <Fragment key={row.id}>
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={rowClassName?.(row)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cellClassName?.(cell)}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                {row.getIsExpanded() && renderSubComponent && (
                                    <tr>
                                        <td colSpan={row.getVisibleCells().length}>{renderSubComponent({ row })}</td>
                                    </tr>
                                )}
                            </Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export { DataTable };
export type { DataTableProps };
