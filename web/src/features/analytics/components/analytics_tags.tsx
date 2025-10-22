import { DataTable, DataTableSmart, DataTableColumnHeader } from "netra";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";

import { PnL } from "@/components/pnl";
import { useGetAnalyticsTags } from "@/hooks/api_hooks/analytics";
import { AnalyticsTagsSummaryItem } from "@/lib/api/analytics";

const analyticsTagColumns: ColumnDef<AnalyticsTagsSummaryItem>[] = [
    {
        accessorKey: "tag_group",
        header: ({ column }) => <DataTableColumnHeader title="Tag Group" column={column} />,
        cell: ({ row }) => <span>{row.original.tag_group}</span>,
    },
    {
        accessorKey: "tag_name",
        header: ({ column }) => <DataTableColumnHeader title="Tag Name" column={column} />,
        cell: ({ row }) => <span>{row.original.tag_name}</span>,
    },
    {
        accessorKey: "gross_pnl",
        header: ({ column }) => <DataTableColumnHeader title="Gross PnL" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.gross_pnl)}>{row.original.gross_pnl}</PnL>,
    },
    {
        accessorKey: "net_pnl",
        header: ({ column }) => <DataTableColumnHeader title="Net PnL" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.net_pnl)}>{row.original.net_pnl}</PnL>,
    },
    {
        accessorKey: "charges",
        header: ({ column }) => <DataTableColumnHeader title="Charges" column={column} />,
        cell: ({ row }) => <span>{row.original.charges}</span>,
    },
    {
        accessorKey: "positions_count",
        header: ({ column }) => <DataTableColumnHeader title="Positions Count" column={column} />,
        cell: ({ row }) => <span>{row.original.positions_count}</span>,
    },
    {
        accessorKey: "r_factor",
        header: ({ column }) => <DataTableColumnHeader title="R Factor" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.r_factor)}>{row.original.r_factor}</PnL>,
    },
];

export function AnalyticsTags() {
    const { data, isLoading, error } = useGetAnalyticsTags();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const summary = data?.data.summary ?? [];

    return (
        <div>
            <h2 className="sub-heading">Summary</h2>

            <div className="h-4" />

            <DataTableSmart data={summary} columns={analyticsTagColumns}>
                {(table) => <DataTable table={table} />}
            </DataTableSmart>
        </div>
    );
}
