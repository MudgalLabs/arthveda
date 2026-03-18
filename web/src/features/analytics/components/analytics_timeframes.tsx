import { LoadingScreen, ErrorMessage, Card, IconInfo, Tooltip } from "netra";
import { Cell, ColumnDef, Row } from "@tanstack/react-table";
import Decimal from "decimal.js";

import { apiHooks } from "@/hooks/api_hooks";
import { PnL } from "@/components/pnl";
import { CurrencyCode } from "@/lib/api/currency";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { decimalSortingFn, formatCurrency, formatHoldingPeriod } from "@/lib/utils";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTable } from "@/s8ly/data_table/data_table";
import {
    AnalyticsTimeDayOfTheWeekItem,
    AnalyticsTimeHoldingPeriodItem,
    AnalyticsTimeHourOfTheDayItem,
} from "@/lib/api/analytics";

function getAnalyticsTimeDayColumns(currencyCode: CurrencyCode): ColumnDef<AnalyticsTimeDayOfTheWeekItem>[] {
    return [
        {
            accessorKey: "day",
            meta: { columnVisibilityHeader: "Day" },
            header: ({ column }) => <DataTableColumnHeader className="w-30" title="Day" column={column} />,
            cell: ({ row }) => <span className="capitalize">{row.original.day}</span>,
            enableSorting: false,
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions" },
            header: ({ column }) => (
                <DataTableColumnHeader
                    title={
                        <span className="flex-x">
                            Positions{" "}
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
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), { currency: currencyCode }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Charges" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.charges).toFixed(2), { currency: currencyCode }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_r_factor",
            meta: { columnVisibilityHeader: "Gross R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_r_factor)}>
                    {formatCurrency(new Decimal(row.original.gross_r_factor).toFixed(2), { hideSymbol: true })}
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
            header: ({ column }) => <DataTableColumnHeader className="w-30" title="Hour" column={column} />,
            cell: ({ row }) => {
                const [start, end] = row.original.hour.split("_");
                return <span className="tabular-nums">{`${start}:00 – ${end}:00`}</span>;
            },
            enableHiding: false,
            enableSorting: false,
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions" },
            header: ({ column }) => (
                <DataTableColumnHeader
                    title={
                        <span className="flex-x">
                            Positions{" "}
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
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), { currency: currencyCode }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Charges" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.charges).toFixed(2), { currency: currencyCode }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), { currency: currencyCode })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_r_factor",
            meta: { columnVisibilityHeader: "Gross R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_r_factor)}>
                    {formatCurrency(new Decimal(row.original.gross_r_factor).toFixed(2), { hideSymbol: true })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
    ];
}

function getAnalyticsTimeHoldingColumns(currencyCode: CurrencyCode): ColumnDef<AnalyticsTimeHoldingPeriodItem>[] {
    return [
        {
            accessorKey: "period",
            meta: { columnVisibilityHeader: "Period" },
            header: ({ column }) => <DataTableColumnHeader title="Period" column={column} />,
            cell: ({ row }) => <span>{formatHoldingPeriod(row.original.period)}</span>,
            enableSorting: false,
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions" },
            header: ({ column }) => (
                <DataTableColumnHeader
                    title={
                        <span className="flex-x">
                            Positions{" "}
                            <Tooltip content="Each closed position contributes once to the holding period bucket based on how long it was held.">
                                <IconInfo />
                            </Tooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => <span>{row.original.positions_count}</span>,
        },
        {
            accessorKey: "gross_pnl",
            meta: { columnVisibilityHeader: "Gross PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), {
                    currency: currencyCode,
                }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Charges" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.charges).toFixed(2), {
                    currency: currencyCode,
                }),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), {
                        currency: currencyCode,
                    })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_r_factor",
            meta: { columnVisibilityHeader: "Gross R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.gross_r_factor)}>
                    {formatCurrency(new Decimal(row.original.gross_r_factor).toFixed(2), { hideSymbol: true })}
                </PnL>
            ),
            sortingFn: decimalSortingFn,
        },
    ];
}

function rowClassName(row: Row<any>) {
    return row.original.positions_count === 0 ? "opacity-40 text-text-muted" : "";
}

function cellClassName(cell: Cell<any, any>) {
    const rightAlignedColumns = ["gross_pnl", "net_pnl", "charges", "gross_r_factor"];
    return rightAlignedColumns.includes(cell.column.id) ? "text-right tabular-nums" : "";
}

export function AnalyticsTimeframes() {
    const { data, isLoading, error } = apiHooks.analytics.useGetAnalyticsTimeframes();

    const dayOfTheWeekData = data?.data.day_of_the_week ?? [];
    const hourOfTheDayData = data?.data.hour_of_the_day ?? [];
    const holdingPeriodData = data?.data.holding_period ?? [];

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
        <div className="space-y-6">
            <section>
                <h2 className="section-heading-muted mb-2">Holding Duration</h2>

                <DataTableSmart
                    data={holdingPeriodData}
                    columns={getAnalyticsTimeHoldingColumns(homeCurrency)}
                    total={holdingPeriodData.length}
                    isFetching={isLoading}
                >
                    {(table) => (
                        <div className="space-y-4">
                            <DataTable table={table} rowClassName={rowClassName} cellClassName={cellClassName} />
                        </div>
                    )}
                </DataTableSmart>
            </section>

            <section>
                <h2 className="section-heading-muted mb-2">Day of the Week</h2>

                <DataTableSmart
                    data={dayOfTheWeekData}
                    columns={getAnalyticsTimeDayColumns(homeCurrency)}
                    total={dayOfTheWeekData.length}
                    isFetching={isLoading}
                >
                    {(table) => <DataTable table={table} rowClassName={rowClassName} cellClassName={cellClassName} />}
                </DataTableSmart>
            </section>

            <section>
                <h2 className="section-heading-muted mb-2">Hour of the Day</h2>

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
                    isFetching={isLoading}
                >
                    {(table) => <DataTable table={table} rowClassName={rowClassName} cellClassName={cellClassName} />}
                </DataTableSmart>
            </section>
        </div>
    );
}
