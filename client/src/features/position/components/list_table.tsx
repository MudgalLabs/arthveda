import { FC, memo } from "react";
import { ColumnDef } from "@tanstack/react-table";

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
import { formatCurrency, formatDate } from "@/lib/utils";

export interface PositionsTableProps {
    positions: Position[];
    totalItems?: number;
    state?: DataTableState;
    onStateChange?: (newState: DataTableState) => void;
    isError?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
}

export const PositionsTable: FC<PositionsTableProps> = memo(
    ({
        positions,
        totalItems,
        state,
        onStateChange,
        isError,
        isFetching,
        isLoading,
    }) => {
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
                    <DataTableSmart
                        columns={columns}
                        data={positions}
                        total={totalItems}
                        state={state}
                        onStateChange={onStateChange}
                        isFetching={isFetching}
                    />
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
