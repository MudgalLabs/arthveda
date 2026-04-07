import { ColumnDef } from "@tanstack/react-table";
import { Card, ErrorMessage, IconInfo, LoadingScreen, Tooltip } from "netra";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import Decimal from "decimal.js";

import { apiHooks } from "@/hooks/api_hooks";
import { CurrencyCode } from "@/lib/api/currency";
import { InstrumentsPerformanceItem } from "@/lib/api/report";
import { decimalSortingFn, formatCurrency } from "@/lib/utils";
import { PnL } from "@/components/pnl";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { useHomeCurrency } from "@/features/auth/auth_context";

export function ReportsInstruments() {
    const { data, isLoading, error } = apiHooks.report.useGetAnalyticsInstruments();
    const homeCurrency = useHomeCurrency();

    const instrumentData = data?.data.performance ?? [];

    if (isLoading) return <LoadingScreen />;

    if (error) return <ErrorMessage errorMsg="Failed to load instruments based analytics." />;

    if (instrumentData.length === 0) {
        return (
            <Card className="absolute-center text-text-muted space-y-2 text-center text-balance">
                <p>No data available for instrument analytics.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <section>
                <h2 className="section-heading-muted mb-2">Performance</h2>

                <DataTableSmart
                    data={instrumentData}
                    columns={getAnalyticsInstrumentColumns(homeCurrency)}
                    total={instrumentData.length}
                    isFetching={isLoading}
                >
                    {(table) => (
                        <DataTable
                            table={table}
                            rowClassName={() => ""}
                            cellClassName={(cell) => {
                                const rightAlignedColumns = [
                                    "positions_count_percentage",
                                    "win_rate",
                                    "gross_pnl",
                                    "net_pnl",
                                    "net_pnl_percentage",
                                ];
                                return rightAlignedColumns.includes(cell.column.id) ? "text-right tabular-nums" : "";
                            }}
                        />
                    )}
                </DataTableSmart>
            </section>
        </div>
    );
}

function getAnalyticsInstrumentColumns(currencyCode: CurrencyCode): ColumnDef<InstrumentsPerformanceItem>[] {
    return [
        {
            accessorKey: "instrument",
            header: ({ column }) => <DataTableColumnHeader title="Instrument" column={column} />,
            cell: ({ row }) => {
                const value = row.original.instrument;
                return <span className="capitalize">{value}</span>;
            },
        },
        {
            accessorKey: "positions_count",
            header: ({ column }) => <DataTableColumnHeader title="Positions" column={column} />,
            cell: ({ row }) => <span>{row.original.positions_count}</span>,
        },
        {
            accessorKey: "positions_count_percentage",
            header: ({ column }) => (
                <DataTableColumnHeader
                    align="right"
                    title={
                        <span className="flex-x">
                            Positions %
                            <Tooltip content="Percentage of your total trades taken in this instrument.">
                                <IconInfo />
                            </Tooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const val = new Decimal(row.original.positions_count_percentage);
                return <span>{val.toFixed(1)}%</span>;
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "win_rate",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Win %" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.win_rate);
                return <span>{val.toFixed(1)}%</span>;
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_pnl",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.gross_pnl);
                return formatCurrency(val.toFixed(2), { currency: currencyCode });
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.net_pnl);
                return <PnL value={val}>{formatCurrency(val.toFixed(2), { currency: currencyCode })}</PnL>;
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "net_pnl_percentage",
            header: ({ column }) => (
                <DataTableColumnHeader
                    align="right"
                    title={
                        <span className="flex-x">
                            Net PnL %
                            <Tooltip content="Contribution of this instrument to your total net PnL. Can exceed 100% if other instruments have losses.">
                                <IconInfo />
                            </Tooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const val = new Decimal(row.original.net_pnl_percentage);
                return <PnL value={val}>{val.toFixed(1)}%</PnL>;
            },
            sortingFn: decimalSortingFn,
        },
    ];
}
