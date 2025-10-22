import { useMemo } from "react";
import { DataTable, DataTableSmart, DataTableColumnHeader, LoadingScreen, ErrorMessage } from "netra";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";

import { PnL } from "@/components/pnl";
import { useGetAnalyticsTags } from "@/hooks/api_hooks/analytics";
import { AnalyticsTagsSummaryItem } from "@/lib/api/analytics";
import WidgetBarPnLGraph from "@/features/dashboard/widget/widget_bar_pnl_graph";
import WidgetCumulativePnLLineChart from "@/features/dashboard/widget/widget_cumulative_pnl_line_chart";

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

    return (
        <div>
            <h2 className="sub-heading">Summary</h2>
            <div className="h-4" />
            <DataTableSmart data={summary} columns={analyticsTagColumns}>
                {(table) => <DataTable table={table} />}
            </DataTableSmart>

            <div className="h-8" />

            {chartDataByTagGroup.map((group) => (
                <div key={group.tag_group} className="mb-8">
                    <h3 className="mb-2 text-lg font-semibold">{group.tag_group}</h3>

                    <div className="flex flex-wrap gap-x-8">
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

            <p className="text-chart-1">Testing</p>
        </div>
    );
}
