import { DataTableColumnHeader, LoadingScreen, ErrorMessage, Card, IconInfo, Tooltip } from "netra";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";

import { apiHooks } from "@/hooks/api_hooks";
import { PnL } from "@/components/pnl";
import { CurrencyCode } from "@/lib/api/currency";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { decimalSortingFn, formatCurrency } from "@/lib/utils";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTable } from "@/s8ly/data_table/data_table";
import { AnalyticsTimeDayOfTheWeekItem, AnalyticsTimeHourOfTheDayItem } from "@/lib/api/analytics";

function getAnalyticsTimeDayColumns(currencyCode: CurrencyCode): ColumnDef<AnalyticsTimeDayOfTheWeekItem>[] {
    return [
        {
            accessorKey: "day",
            meta: { columnVisibilityHeader: "Day" },
            header: ({ column }) => <DataTableColumnHeader title="Day" column={column} />,
            cell: ({ row }) => <span className="capitalize">{row.original.day}</span>,

            enableSorting: false,
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions count" },
            header: ({ column }) => (
                <DataTableColumnHeader
                    title={
                        <span className="flex-x">
                            Positions count{" "}
                            <Tooltip content="If a position's profit or loss is realized on multiple days, it will be counted for each of those days.">
                                <IconInfo />
                            </Tooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => <span className="capitalize">{row.original.positions_count}</span>,
        },
        {
            accessorKey: "gross_pnl",
            meta: { columnVisibilityHeader: "Gross PnL" },
            header: ({ column }) => <DataTableColumnHeader title="Gross PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_pnl)}>
                    {formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader title="Charges" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.charges)} variant="negative">
                    {formatCurrency(new Decimal(row.original.charges).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_r_factor",
            meta: { columnVisibilityHeader: "Gross R Factor" },
            header: ({ column }) => <DataTableColumnHeader title="Gross R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_r_factor)}>
                    {new Decimal(row.original.gross_r_factor).toFixed(2)}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
    ];
}

function getAnalyticsTimeHourColumns(currencyCode: CurrencyCode): ColumnDef<AnalyticsTimeHourOfTheDayItem>[] {
    return [
        {
            accessorKey: "hour",
            meta: { columnVisibilityHeader: "Hour" },
            header: ({ column }) => <DataTableColumnHeader title="Hour" column={column} />,
            cell: ({ row }) => <span>{row.original.hour.replace("_", " - ")}</span>,
            enableHiding: false,
            enableSorting: false,
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions count" },
            header: ({ column }) => (
                <DataTableColumnHeader
                    title={
                        <span className="flex-x">
                            Positions count{" "}
                            <Tooltip content="If a position's profit or loss is realized across multiple hours (for example through partial exits), it will be counted in each of those hours.">
                                <IconInfo />
                            </Tooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => <span>{row.original.positions_count}</span>,
            enableHiding: false,
        },
        {
            accessorKey: "gross_pnl",
            meta: { columnVisibilityHeader: "Gross PnL" },
            header: ({ column }) => <DataTableColumnHeader title="Gross PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_pnl)}>
                    {formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader title="Charges" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.charges)} variant="negative">
                    {formatCurrency(new Decimal(row.original.charges).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_r_factor",
            meta: { columnVisibilityHeader: "Gross R Factor" },
            header: ({ column }) => <DataTableColumnHeader title="Gross R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_r_factor)}>
                    {new Decimal(row.original.gross_r_factor).toFixed(2)}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
    ];
}

export function AnalyticsTime() {
    const { data, isLoading, error } = apiHooks.analytics.useGetAnalyticsTime();

    const dayOfTheWeekData = data?.data.day_of_the_week ?? [];
    const hourOfTheDayData = data?.data.hour_of_the_day ?? [];

    const homeCurrency = useHomeCurrency();

    if (isLoading) return <LoadingScreen />;

    if (error) return <ErrorMessage errorMsg="Failed to load time based analytics." />;

    if (dayOfTheWeekData.length === 0) {
        return (
            <Card className="absolute-center text-text-muted space-y-2 text-center text-balance">
                <p>No data available for time based analytics.</p>
            </Card>
        );
    }

    return (
        <div>
            <h2 className="sub-heading">Day of the Week</h2>
            <div className="h-4" />

            <DataTableSmart
                data={dayOfTheWeekData}
                columns={getAnalyticsTimeDayColumns(homeCurrency)}
                total={dayOfTheWeekData.length}
                // state={tableState}
                // onStateChange={setTableState}
                isFetching={isLoading}
            >
                {(table) => <DataTable table={table} />}
            </DataTableSmart>

            <h2 className="sub-heading mt-8">Hour of the Day</h2>
            <div className="h-4" />

            <DataTableSmart
                data={hourOfTheDayData}
                columns={getAnalyticsTimeHourColumns(homeCurrency)}
                total={hourOfTheDayData.length}
                state={{
                    pagination: {
                        pageIndex: 0,
                        pageSize: -1,
                    },
                }}
                // state={tableState}
                // onStateChange={setTableState}
                isFetching={isLoading}
            >
                {(table) => (
                    <DataTable
                        table={table}
                        rowClassName={(row) => (row.original.positions_count === 0 ? "opacity-40" : "")}
                    />
                )}
            </DataTableSmart>
        </div>
    );
}
