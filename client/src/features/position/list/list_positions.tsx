import { ColumnDef } from "@tanstack/react-table";

import { Loading } from "@/components/loading";
import { apiHooks } from "@/hooks/api_hooks";
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

export const ListPositions = () => {
    const { data, isLoading } = apiHooks.position.useSearch();

    if (isLoading) {
        return <Loading />;
    }

    return (
        <>
            <PageHeading heading="Positions" />
            <PositionsTable positions={data?.data.items || []} />
        </>
    );
};

export default ListPositions;

const columns: ColumnDef<Position>[] = [
    {
        id: "Opened At",
        accessorKey: "opened_at",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Opened At" />
        ),
        cell: ({ row }) =>
            formatDate(new Date(row.original.opened_at), { time: true }),
    },
    {
        id: "Symbol",
        accessorKey: "symbol",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Symbol" />
        ),
    },
    {
        id: "Direction",
        accessorKey: "direction",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Direction" />
        ),
        cell: ({ row }) => (
            <DirectionTag className="w-16" direction={row.original.direction} />
        ),
    },
    {
        id: "Status",
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
            <StatusTag
                status={row.original.status}
                currency={row.original.currency}
                openQuantity={row.original.open_quantity}
                openAvgPrice={row.original.open_average_price_amount}
            />
        ),
    },
    {
        id: "Instrument",
        accessorKey: "instrument",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Instrument" />
        ),
        cell: ({ row }) => positionInstrumentToString(row.original.instrument),
    },
    {
        id: "R Factor",
        accessorKey: "r_factor",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="R Factor" />
        ),
    },
    {
        id: "Gross PnL",
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
        id: "Net PnL",
        accessorKey: "net_pnl_amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Net PnL" />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.net_pnl_amount, row.original.currency),
    },
    {
        id: "Charges",
        accessorKey: "charges_amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Charges" />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.charges_amount, row.original.currency),
    },
    {
        id: "Charges %",
        accessorKey: "charges_as_percentage_of_net_pnl",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Charges" />
        ),
        cell: ({ row }) =>
            `${Number(row.original.charges_as_percentage_of_net_pnl).toFixed(2)}%`,
    },
];

const PositionsTable = ({ positions }: { positions: Position[] }) => {
    return <DataTableSmart columns={columns} data={positions} />;
};
