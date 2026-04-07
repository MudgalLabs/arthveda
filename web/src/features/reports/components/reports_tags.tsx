import { useMemo } from "react";
import {
    LoadingScreen,
    ErrorMessage,
    useLocalStorageState,
    DataTableState,
    DEFAULT_DATA_TABLE_STATE,
    DataTableVisibility,
    Card,
} from "netra";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";

import { PnL } from "@/components/pnl";
import { apiHooks } from "@/hooks/api_hooks";
import { AnalyticsTagsSummaryItem } from "@/lib/api/report";
import WidgetBarPnLGraph from "@/features/dashboard/widget/widget_bar_pnl_graph";
import WidgetCumulativePnLLineChart from "@/features/dashboard/widget/widget_cumulative_pnl_line_chart";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTable } from "@/s8ly/data_table/data_table";
import { CurrencyCode } from "@/lib/api/currency";
import { useHomeCurrency } from "@/features/auth/auth_context";

const rightAlignedColumns = [
    "gross_pnl",
    "net_pnl",
    "charges",
    "positions_count",
    "r_factor",
    "avg_win",
    "avg_loss",
    "max_win",
    "max_loss",
    "avg_r_factor",
    "avg_win_r_factor",
    "avg_loss_r_factor",
    "avg_win_roi",
    "avg_loss_roi",
    "win_streak",
    "loss_streak",
    "wins_count",
    "losses_count",
    "win_rate",
    "loss_rate",
];

function getAnalyticsTagColumns(homeCurrency: CurrencyCode): ColumnDef<AnalyticsTagsSummaryItem>[] {
    return [
        {
            accessorKey: "tag_group",
            meta: { columnVisibilityHeader: "Tag Group" },
            header: ({ column }) => <DataTableColumnHeader title="Tag Group" column={column} />,
            cell: ({ row }) => <span>{row.original.tag_group}</span>,
            enableHiding: false,
        },
        {
            accessorKey: "tag_name",
            meta: { columnVisibilityHeader: "Tag Name" },
            header: ({ column }) => <DataTableColumnHeader title="Tag Name" column={column} />,
            cell: ({ row }) => <span>{row.original.tag_name}</span>,
            enableHiding: false,
        },

        // --- PRIMARY METRIC ---
        {
            accessorKey: "net_pnl",
            meta: { columnVisibilityHeader: "Net PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.net_pnl)}>
                    {formatCurrency(new Decimal(row.original.net_pnl).toFixed(2), { currency: homeCurrency })}
                </PnL>
            ),
        },

        // --- SECONDARY METRIC ---
        {
            accessorKey: "avg_r_factor",
            meta: { columnVisibilityHeader: "Avg R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg R Factor" column={column} />,
            cell: ({ row }) => (
                <PnL value={new Decimal(row.original.avg_r_factor)}>
                    {formatCurrency(new Decimal(row.original.avg_r_factor).toFixed(2), { hideSymbol: true })}
                </PnL>
            ),
        },

        // --- NEUTRAL METRICS ---
        {
            accessorKey: "gross_pnl",
            meta: { columnVisibilityHeader: "Gross PnL" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.gross_pnl).toFixed(2), { currency: homeCurrency }),
        },
        {
            accessorKey: "charges",
            meta: { columnVisibilityHeader: "Charges" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Charges" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.charges).toFixed(2), { currency: homeCurrency }),
        },
        {
            accessorKey: "positions_count",
            meta: { columnVisibilityHeader: "Positions" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Positions" column={column} />,
            cell: ({ row }) => <span className="text-right">{row.original.positions_count}</span>,
        },

        {
            accessorKey: "r_factor",
            meta: { columnVisibilityHeader: "R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="R Factor" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.r_factor).toFixed(2), { hideSymbol: true }),
        },

        {
            accessorKey: "avg_win",
            meta: { columnVisibilityHeader: "Avg Win" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Win" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.avg_win).toFixed(2), { currency: homeCurrency }),
        },
        {
            accessorKey: "avg_loss",
            meta: { columnVisibilityHeader: "Avg Loss" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Loss" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.avg_loss).toFixed(2), { currency: homeCurrency }),
        },
        {
            accessorKey: "max_win",
            meta: { columnVisibilityHeader: "Max Win" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Max Win" column={column} />,
            cell: ({ row }) => formatCurrency(new Decimal(row.original.max_win).toFixed(2), { currency: homeCurrency }),
        },
        {
            accessorKey: "max_loss",
            meta: { columnVisibilityHeader: "Max Loss" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Max Loss" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.max_loss).toFixed(2), { currency: homeCurrency }),
        },

        {
            accessorKey: "avg_win_r_factor",
            meta: { columnVisibilityHeader: "Avg Win R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Win R Factor" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.avg_win_r_factor).toFixed(2), { hideSymbol: true }),
        },
        {
            accessorKey: "avg_loss_r_factor",
            meta: { columnVisibilityHeader: "Avg Loss R Factor" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Loss R Factor" column={column} />,
            cell: ({ row }) =>
                formatCurrency(new Decimal(row.original.avg_loss_r_factor).toFixed(2), { hideSymbol: true }),
        },

        {
            accessorKey: "avg_win_roi",
            meta: { columnVisibilityHeader: "Avg Win ROI" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Win ROI" column={column} />,
            cell: ({ row }) =>
                `${formatCurrency(new Decimal(row.original.avg_win_roi).toFixed(2), { hideSymbol: true })}%`,
        },
        {
            accessorKey: "avg_loss_roi",
            meta: { columnVisibilityHeader: "Avg Loss ROI" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg Loss ROI" column={column} />,
            cell: ({ row }) =>
                `${formatCurrency(new Decimal(row.original.avg_loss_roi).toFixed(2), { hideSymbol: true })}%`,
        },

        {
            accessorKey: "win_streak",
            meta: { columnVisibilityHeader: "Win Streak" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Win Streak" column={column} />,
            cell: ({ row }) => <span className="text-right">{row.original.win_streak}</span>,
        },
        {
            accessorKey: "loss_streak",
            meta: { columnVisibilityHeader: "Loss Streak" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Loss Streak" column={column} />,
            cell: ({ row }) => <span className="text-right">{row.original.loss_streak}</span>,
        },

        {
            accessorKey: "wins_count",
            meta: { columnVisibilityHeader: "Wins Count" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Wins Count" column={column} />,
            cell: ({ row }) => <span className="text-right">{row.original.wins_count}</span>,
        },
        {
            accessorKey: "losses_count",
            meta: { columnVisibilityHeader: "Losses Count" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Losses Count" column={column} />,
            cell: ({ row }) => <span className="text-right">{row.original.losses_count}</span>,
        },

        {
            accessorKey: "win_rate",
            meta: { columnVisibilityHeader: "Win Rate (%)" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Win Rate (%)" column={column} />,
            cell: ({ row }) => `${row.original.win_rate?.toFixed(2)}%`,
        },
        {
            accessorKey: "loss_rate",
            meta: { columnVisibilityHeader: "Loss Rate (%)" },
            header: ({ column }) => <DataTableColumnHeader align="right" title="Loss Rate (%)" column={column} />,
            cell: ({ row }) => `${row.original.loss_rate?.toFixed(2)}%`,
        },
    ];
}

export function ReportsTags() {
    const [tableState, setTableState] = useLocalStorageState<DataTableState>(
        ROUTES.reports + "?tab=tags",
        DEFAULT_DATA_TABLE_STATE
    );

    const homeCurrency = useHomeCurrency();

    const { data, isLoading, error } = apiHooks.report.useGetAnalyticsTags();

    const summary = data?.data.summary ?? [];
    const summaryGroup = data?.data.summary_group ?? [];
    const cumulativePnLByTagGroup = data?.data.cumulative_pnl_by_tag_group ?? [];

    // Memoize chart data for efficiency
    const chartDataByTagGroup = useMemo(() => {
        // Total PnL bar chart data
        const totalPnL: Record<string, any[]> = {};
        summaryGroup.forEach((group: any) => {
            totalPnL[group.tag_group] = group.tags.map((tag: any) => ({
                label: tag.tag_name,
                net_pnl: parseFloat(tag.net_pnl),
                gross_pnl: parseFloat(tag.gross_pnl),
                charges: parseFloat(tag.charges),
            }));
        });

        // Cumulative PnL line chart data
        const cumulativePnL: Record<string, any[]> = {};
        cumulativePnLByTagGroup.forEach((group: any) => {
            const mergedBuckets: Record<string, any> = {};
            group.tags.forEach((tag: any) => {
                tag.buckets.forEach((bucket: any) => {
                    if (!mergedBuckets[bucket.label]) {
                        mergedBuckets[bucket.label] = { label: bucket.label };
                    }
                    mergedBuckets[bucket.label][tag.tag_name] = bucket.net_pnl;
                });
            });
            cumulativePnL[group.tag_group] = Object.values(mergedBuckets);
        });

        // Combine both for easy access
        const tagGroups = Array.from(new Set([...Object.keys(totalPnL), ...Object.keys(cumulativePnL)]));
        return tagGroups.map((tag_group) => ({
            tag_group,
            totalPnL: totalPnL[tag_group] ?? [],
            cumulativePnL: cumulativePnL[tag_group] ?? [],
            cumulativeTags: cumulativePnLByTagGroup.find((g: any) => g.tag_group === tag_group)?.tags ?? [],
        }));
    }, [summaryGroup, cumulativePnLByTagGroup]);

    if (isLoading) return <LoadingScreen />;

    if (error) return <ErrorMessage errorMsg="Failed to load tags based analytics." />;

    if (summary.length === 0) {
        return (
            <Card className="absolute-center text-text-muted space-y-2 text-center text-balance">
                <p>No data available for tags based analytics.</p>
                <p>Start tagging your positions to see analytics here.</p>
            </Card>
        );
    }

    return (
        <div>
            <DataTableSmart
                data={summary}
                columns={getAnalyticsTagColumns(homeCurrency)}
                total={summary.length}
                state={tableState}
                onStateChange={setTableState}
                isFetching={isLoading}
            >
                {(table) => (
                    <>
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="section-heading-muted">Summary</h2>
                            <DataTableVisibility table={table} />
                        </div>

                        <DataTable
                            table={table}
                            cellClassName={(cell) =>
                                rightAlignedColumns.includes(cell.column.id) ? "text-right tabular-nums" : ""
                            }
                        />
                    </>
                )}
            </DataTableSmart>

            <div className="h-8" />

            {chartDataByTagGroup.map((group) => (
                <div key={group.tag_group} className="mb-6">
                    <h3 className="section-heading-muted mb-2">{group.tag_group}</h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-4">
                        <div className="h-[44vh] min-h-[300px] min-w-[300px] flex-1">
                            <WidgetBarPnLGraph data={group.totalPnL} isResizable />
                        </div>

                        <div className="h-[44vh] min-h-[300px] min-w-[300px] flex-1">
                            <WidgetCumulativePnLLineChart
                                data={group.cumulativePnL}
                                tags={group.cumulativeTags}
                                isResizable
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
