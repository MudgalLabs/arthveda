import { useMemo } from "react";
import {
    DataTable,
    DataTableSmart,
    DataTableColumnHeader,
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
import { useGetAnalyticsTags } from "@/hooks/api_hooks/analytics";
import { AnalyticsTagsSummaryItem } from "@/lib/api/analytics";
import WidgetBarPnLGraph from "@/features/dashboard/widget/widget_bar_pnl_graph";
import WidgetCumulativePnLLineChart from "@/features/dashboard/widget/widget_cumulative_pnl_line_chart";
import { ROUTES } from "@/constants";

const analyticsTagColumns: ColumnDef<AnalyticsTagsSummaryItem>[] = [
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
    {
        accessorKey: "gross_pnl",
        meta: { columnVisibilityHeader: "Gross PnL" },
        header: ({ column }) => <DataTableColumnHeader title="Gross PnL" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.gross_pnl)}>{row.original.gross_pnl}</PnL>,
    },
    {
        accessorKey: "net_pnl",
        meta: { columnVisibilityHeader: "Net PnL" },
        header: ({ column }) => <DataTableColumnHeader title="Net PnL" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.net_pnl)}>{row.original.net_pnl}</PnL>,
    },
    {
        accessorKey: "charges",
        meta: { columnVisibilityHeader: "Charges" },
        header: ({ column }) => <DataTableColumnHeader title="Charges" column={column} />,
        cell: ({ row }) => <span>{row.original.charges}</span>,
    },
    {
        accessorKey: "positions_count",
        meta: { columnVisibilityHeader: "Positions Count" },
        header: ({ column }) => <DataTableColumnHeader title="Positions Count" column={column} />,
        cell: ({ row }) => <span>{row.original.positions_count}</span>,
    },
    {
        accessorKey: "r_factor",
        meta: { columnVisibilityHeader: "R Factor" },
        header: ({ column }) => <DataTableColumnHeader title="R Factor" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.r_factor)}>{row.original.r_factor}</PnL>,
    },
    {
        accessorKey: "avg_win",
        meta: { columnVisibilityHeader: "Avg Win" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Win" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.avg_win)}>{row.original.avg_win}</PnL>,
    },
    {
        accessorKey: "avg_loss",
        meta: { columnVisibilityHeader: "Avg Loss" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Loss" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.avg_loss)}>{row.original.avg_loss}</PnL>,
    },
    {
        accessorKey: "max_win",
        meta: { columnVisibilityHeader: "Max Win" },
        header: ({ column }) => <DataTableColumnHeader title="Max Win" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.max_win)}>{row.original.max_win}</PnL>,
    },
    {
        accessorKey: "max_loss",
        meta: { columnVisibilityHeader: "Max Loss" },
        header: ({ column }) => <DataTableColumnHeader title="Max Loss" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.max_loss)}>{row.original.max_loss}</PnL>,
    },
    {
        accessorKey: "avg_r_factor",
        meta: { columnVisibilityHeader: "Avg R Factor" },
        header: ({ column }) => <DataTableColumnHeader title="Avg R Factor" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.avg_r_factor)}>{row.original.avg_r_factor}</PnL>,
    },
    {
        accessorKey: "avg_win_r_factor",
        meta: { columnVisibilityHeader: "Avg Win R Factor" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Win R Factor" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.avg_win_r_factor)}>{row.original.avg_win_r_factor}</PnL>
        ),
    },
    {
        accessorKey: "avg_loss_r_factor",
        meta: { columnVisibilityHeader: "Avg Loss R Factor" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Loss R Factor" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.avg_loss_r_factor)}>{row.original.avg_loss_r_factor}</PnL>
        ),
    },
    {
        accessorKey: "avg_win_roi",
        meta: { columnVisibilityHeader: "Avg Win ROI" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Win ROI" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.avg_win_roi)}>{row.original.avg_win_roi}%</PnL>,
    },
    {
        accessorKey: "avg_loss_roi",
        meta: { columnVisibilityHeader: "Avg Loss ROI" },
        header: ({ column }) => <DataTableColumnHeader title="Avg Loss ROI" column={column} />,
        cell: ({ row }) => <PnL value={new Decimal(row.original.avg_loss_roi)}>{row.original.avg_loss_roi}%</PnL>,
    },
    {
        accessorKey: "win_streak",
        meta: { columnVisibilityHeader: "Win Streak" },
        header: ({ column }) => <DataTableColumnHeader title="Win Streak" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.win_streak)} variant="positive">
                {row.original.win_streak}
            </PnL>
        ),
    },
    {
        accessorKey: "loss_streak",
        meta: { columnVisibilityHeader: "Loss Streak" },
        header: ({ column }) => <DataTableColumnHeader title="Loss Streak" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.loss_streak)} variant="negative">
                {row.original.loss_streak}
            </PnL>
        ),
    },
    {
        accessorKey: "wins_count",
        meta: { columnVisibilityHeader: "Wins Count" },
        header: ({ column }) => <DataTableColumnHeader title="Wins Count" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.wins_count)} variant="positive">
                {row.original.wins_count}
            </PnL>
        ),
    },
    {
        accessorKey: "losses_count",
        meta: { columnVisibilityHeader: "Losses Count" },
        header: ({ column }) => <DataTableColumnHeader title="Losses Count" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.losses_count)} variant="negative">
                {row.original.losses_count}
            </PnL>
        ),
    },
    {
        accessorKey: "win_rate",
        meta: { columnVisibilityHeader: "Win Rate (%)" },
        header: ({ column }) => <DataTableColumnHeader title="Win Rate (%)" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.win_rate ?? 0)} variant="positive">
                {row.original.win_rate?.toFixed(2)}%
            </PnL>
        ),
    },
    {
        accessorKey: "loss_rate",
        meta: { columnVisibilityHeader: "Loss Rate (%)" },
        header: ({ column }) => <DataTableColumnHeader title="Loss Rate (%)" column={column} />,
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.loss_rate ?? 0)} variant="negative">
                {row.original.loss_rate?.toFixed(2)}%
            </PnL>
        ),
    },
];

export function AnalyticsTags() {
    const [tableState, setTableState] = useLocalStorageState<DataTableState>(
        ROUTES.analytics + "?tab=tags",
        DEFAULT_DATA_TABLE_STATE
    );

    const { data, isLoading, error } = useGetAnalyticsTags();

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
            <h2 className="sub-heading">Summary</h2>
            <div className="h-4" />

            <DataTableSmart
                data={summary}
                columns={analyticsTagColumns}
                total={summary.length}
                state={tableState}
                onStateChange={setTableState}
                isFetching={isLoading}
            >
                {(table) => (
                    <div className="space-y-4">
                        <div className="flex gap-x-2">
                            <DataTableVisibility table={table} />
                        </div>

                        <DataTable table={table} />
                    </div>
                )}
            </DataTableSmart>

            <div className="h-8" />

            {chartDataByTagGroup.map((group) => (
                <div key={group.tag_group} className="mb-8">
                    <h3 className="mb-2 text-lg font-semibold">{group.tag_group}</h3>

                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        <div className="h-[40vh] min-h-[300px] min-w-[300px] flex-1">
                            <WidgetBarPnLGraph data={group.totalPnL} isResizable />
                        </div>

                        <div className="h-[40vh] min-h-[300px] min-w-[300px] flex-1">
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
