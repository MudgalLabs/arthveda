import { FC, memo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Loading } from "@/components/loading";
import {
    Position,
    positionInstrumentToString,
} from "@/features/position/position";
import {
    DataTableSmart,
    DataTableState,
} from "@/s8ly/data_table/data_table_smart";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { DataTablePagination } from "@/s8ly/data_table/data_table_pagination";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableVisibility } from "@/s8ly/data_table/data_table_visibility";
import { PositionListFilters } from "@/features/position/components/position_list_filters";
import { Tag, Button } from "@/s8ly";
import {
    defaultPositionSearchFilters,
    useListPositions,
    positionSearchFiltersLabel,
    positionSearchFiltersValueFormatter,
} from "@/features/position/list/list_positions_context";
import { IconCross } from "@/components/icons";

export interface PositionListTable {
    positions: Position[];
    hideFilters?: boolean;
    totalItems?: number;
    state?: DataTableState;
    onStateChange?: (newState: DataTableState) => void;
    isError?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
}

export const PositionListTable: FC<PositionListTable> = memo(
    ({
        positions,
        hideFilters = false,
        totalItems,
        state,
        onStateChange,
        isError,
        isFetching,
        isLoading,
    }) => {
        const { appliedFilters, filters, resetFilter, resetFilters } =
            useListPositions();

        const activeFilters = Object.entries(appliedFilters).filter(
            ([key, value]) =>
                value !==
                    defaultPositionSearchFilters[
                        key as keyof typeof defaultPositionSearchFilters
                    ] && !key.includes("operator") // Don't show operator as a filter
        );

        if (isError) {
            return (
                <p className="text-foreground-red">Failed to fetch positions</p>
            );
        }

        if (isLoading) {
            return <Loading />;
        }

        if (positions) {
            return (
                <>
                    {activeFilters.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            {activeFilters.map(([key, value]) => (
                                <Tag key={key} variant="filter">
                                    {
                                        positionSearchFiltersLabel[
                                            key as keyof typeof filters
                                        ]
                                    }
                                    :{" "}
                                    {positionSearchFiltersValueFormatter[
                                        key as keyof typeof positionSearchFiltersValueFormatter
                                    ]?.(value, appliedFilters) ?? String(value)}
                                    <Button
                                        variant="link"
                                        size="small"
                                        className="text-foreground-muted hover:text-foreground p-0 hover:cursor-pointer"
                                        onClick={() =>
                                            resetFilter(
                                                key as keyof typeof filters
                                            )
                                        }
                                    >
                                        <IconCross size={20} />
                                    </Button>
                                </Tag>
                            ))}
                            <Button
                                size="small"
                                variant="link"
                                onClick={resetFilters}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}

                    <DataTableSmart
                        columns={columns}
                        data={positions}
                        total={totalItems}
                        state={state}
                        onStateChange={onStateChange}
                        isFetching={isFetching}
                    >
                        {(table) => (
                            <div className="space-y-4">
                                <div className="flex justify-end gap-x-2">
                                    {!hideFilters && <PositionListFilters />}
                                    <DataTableVisibility table={table} />
                                </div>

                                <DataTable table={table} />

                                <DataTablePagination
                                    table={table}
                                    total={totalItems}
                                />
                            </div>
                        )}
                    </DataTableSmart>
                </>
            );
        }

        return null;
    }
);

const columns: ColumnDef<Position>[] = [
    {
        id: "opened",
        meta: {
            columnVisibilityHeader: "Opened At",
        },
        accessorKey: "opened_at",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Opened At"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) =>
            formatDate(new Date(row.original.opened_at), { time: true }),
    },
    {
        id: "symbol",
        meta: {
            columnVisibilityHeader: "Symbol",
        },
        accessorKey: "symbol",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Symbol"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
    },
    {
        id: "direction",
        meta: {
            columnVisibilityHeader: "Direction",
        },
        accessorKey: "direction",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Direction"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) => (
            <DirectionTag className="w-16" direction={row.original.direction} />
        ),
    },
    {
        id: "status",
        meta: {
            columnVisibilityHeader: "Status",
        },
        accessorKey: "status",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Status"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) => (
            <StatusTag
                status={row.original.status}
                currency={row.original.currency}
            />
        ),
    },
    {
        id: "instrument",
        meta: {
            columnVisibilityHeader: "Instrument",
        },
        accessorKey: "instrument",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Instrument"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) => positionInstrumentToString(row.original.instrument),
    },
    {
        id: "r_factor",
        meta: {
            columnVisibilityHeader: "R Factor",
        },
        accessorKey: "r_factor",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="R Factor"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
    },
    {
        id: "gross_pnl",
        meta: {
            columnVisibilityHeader: "Gross PnL",
        },
        accessorKey: "gross_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Gross PnL"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) =>
            formatCurrency(
                row.original.gross_pnl_amount,
                row.original.currency
            ),
    },
    {
        id: "net_pnl",
        meta: {
            columnVisibilityHeader: "Net PnL",
        },
        accessorKey: "net_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Net PnL"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.net_pnl_amount, row.original.currency),
    },
    {
        id: "charges_percentage",
        meta: {
            columnVisibilityHeader: "Charges %",
        },
        accessorKey: "charges_as_percentage_of_net_pnl",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Charges %"
                disabled={table.options.meta?.isFetching}
                column={column}
            />
        ),
        cell: ({ row }) =>
            `${Number(row.original.charges_as_percentage_of_net_pnl).toFixed(2)}%`,
    },
    {
        id: "net_return_percentage",
        meta: {
            columnVisibilityHeader: "Net Return %",
        },
        accessorKey: "net_return_percentage",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="Net Return %"
                disabled={table.options.meta?.isFetching}
                column={column}
            />
        ),
        cell: ({ row }) =>
            `${Number(row.original.net_return_percentage).toFixed(2)}%`,
    },
];
