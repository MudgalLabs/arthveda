import { memo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { DatePicker, Input, Label } from "@/s8ly";
import {
    Position,
    positionInstrumentToString,
} from "@/features/position/position";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { PageHeading } from "@/components/page_heading";
import { useListPositions } from "./list_positions_context";
import { WithLabel } from "@/components/with_label";
import { PositionSearchFilters } from "@/lib/api/position";
import { Loading } from "@/components/loading";

export const ListPositions = () => {
    const { queryResult } = useListPositions();

    return (
        <>
            <PageHeading heading="Positions" loading={queryResult.isFetching} />
            <PositionsFilters />
            <PositionsTable />
        </>
    );
};

export default ListPositions;

function getOpenedFilterValue(filters: PositionSearchFilters): Date[] {
    const dates: Date[] = [];
    const from: Date | undefined = filters.opened?.from;
    const to: Date | undefined = filters.opened?.to;
    if (from) {
        dates.push(from);
    }
    if (to) {
        dates.push(to);
    }
    return dates;
}

const PositionsFilters = memo(({}: {}) => {
    const { searchFilters, setSearchFilters } = useListPositions();

    return (
        <>
            <div className="flex flex-wrap gap-x-16 gap-y-8">
                <WithLabel Label={<Label>Opened</Label>}>
                    <DatePicker
                        mode="range"
                        config={{ dates: { toggle: true } }}
                        dates={getOpenedFilterValue(searchFilters)}
                        onDatesChange={(v) =>
                            setSearchFilters((prev) => ({
                                ...prev,
                                opened: {
                                    from: v[0],
                                    to: v[1],
                                },
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel Label={<Label>Symbol</Label>}>
                    <Input
                        value={searchFilters.symbol}
                        onChange={(e) =>
                            setSearchFilters((prev) => ({
                                ...prev,
                                symbol: e.target.value,
                            }))
                        }
                    />
                </WithLabel>
            </div>

            <div className="h-15" />
        </>
    );
});

const columns: ColumnDef<Position>[] = [
    {
        id: "opened",
        meta: {
            columnVisibilityHeader: "Opened At",
        },
        accessorKey: "opened_at",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Opened At" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Symbol" />
        ),
    },
    {
        id: "direction",
        meta: {
            columnVisibilityHeader: "Direction",
        },
        accessorKey: "direction",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Direction" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Instrument" />
        ),
        cell: ({ row }) => positionInstrumentToString(row.original.instrument),
    },
    {
        id: "r_factor",
        meta: {
            columnVisibilityHeader: "R Factor",
        },
        accessorKey: "r_factor",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="R Factor" />
        ),
    },
    {
        id: "gross_pnl",
        meta: {
            columnVisibilityHeader: "Gross PnL",
        },
        accessorKey: "gross_pnl_amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Gross PnL" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Net PnL" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Charges" />
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Net Return %" />
        ),
        cell: ({ row }) =>
            `${Number(row.original.net_return_percentage).toFixed(2)}%`,
    },
];

const PositionsTable = memo(() => {
    const { queryResult, tableState, setTableState } = useListPositions();

    if (queryResult.isError) {
        return <p className="text-foreground-red">Failed to fetch positions</p>;
    }

    if (queryResult.isLoading) {
        return <Loading />;
    }

    if (queryResult.data) {
        return (
            <DataTableSmart
                columns={columns}
                data={queryResult.data.data.items}
                loading={queryResult.isLoading}
                total={queryResult.data.data.pagination.total_items}
                state={tableState}
                onStateChange={setTableState}
            />
        );
    }
});
