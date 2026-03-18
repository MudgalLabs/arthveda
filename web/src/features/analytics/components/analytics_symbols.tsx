import { EfficiencyInfoTooltip } from "@/components/efficiency_info_tooltip";
import { PnL } from "@/components/pnl";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { SymbolsPerformanceItem } from "@/lib/api/analytics";
import { CurrencyCode } from "@/lib/api/currency";
import { decimalSortingFn, formatCurrency } from "@/lib/utils";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";
import { Card, ErrorMessage, LoadingScreen } from "netra";
import { useState } from "react";

export function AnalyticsSymbols() {
    const { data, isLoading } = apiHooks.analytics.useGetAnalyticsSymbols();

    if (isLoading) return <LoadingScreen />;

    if (!data) return <ErrorMessage errorMsg="Failed to get symbols based analytics." />;

    return (
        <div>
            <div className="flex-y gap-6! md:flex-row!">
                <div className="min-h-[300px] min-w-[300px] flex-1">
                    <h2 className="text-muted-foreground mb-2 text-base font-medium">Best performing symbols</h2>
                    <SymbolsPerformancePie kind="best" data={data?.data.best_performance} />
                </div>

                <div className="min-h-[300px] min-w-[300px] flex-1">
                    <h2 className="text-muted-foreground mb-2 text-base font-medium">Worst performing symbols</h2>
                    <SymbolsPerformancePie kind="worst" data={data?.data.worst_performance} />
                </div>
            </div>

            <div className="h-6 md:h-12" />

            <TopTradedSymbolsTable data={data?.data.top_traded} />
        </div>
    );
}

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";

interface SymbolsPerformancePieProps {
    data: SymbolsPerformanceItem[];
    kind: "best" | "worst";
}

const getColor = (kind: "best" | "worst", index: number) => {
    const base = kind === "best" ? "var(--color-success-foreground)" : "var(--color-error-foreground)";

    const opacityScale = [1, 0.9, 0.8, 0.7, 0.6, 0.6, 0.5, 0.45, 0.4, 0.35];

    return `color-mix(in srgb, ${base} ${opacityScale[index % opacityScale.length] * 100}%, transparent)`;
};

function SymbolsPerformancePie(props: SymbolsPerformancePieProps) {
    const { data, kind } = props;

    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

    const parsed = data.map((d) => ({
        ...d,
        net_pnl: new Decimal(d.net_pnl).toFixed(2),
        net_pnl_abs: Math.abs(Number(new Decimal(d.net_pnl).toFixed(2))),
        win_rate: new Decimal(d.win_rate).toFixed(2),
        avg_gross_r: new Decimal(d.avg_gross_r).toFixed(2),
    }));

    const total = new Decimal(parsed.reduce((acc, d) => acc + d.net_pnl_abs, 0)).toFixed(2);
    const othersColor = "color-mix(in srgb, var(--color-chart-muted) 40%, transparent)";

    return (
        <Card className="relative h-full w-full overflow-hidden">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={parsed}
                            dataKey="net_pnl_abs"
                            nameKey="symbol"
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            paddingAngle={1.5}
                            stroke="var(--color-border)"
                            strokeWidth={1}
                            activeIndex={activeIndex}
                            activeShape={(props: any) => {
                                return <Sector {...props} outerRadius={props.outerRadius + 6} fill={props.fill} />;
                            }}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(undefined)}
                        >
                            {parsed.map((d, i) => (
                                <Cell
                                    key={i}
                                    style={{ transition: "opacity 0.2s" }}
                                    fill={d.symbol === "Others" ? othersColor : getColor(kind, i)}
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            content={<CustomTooltip />}
                            // Otherwise the "Total" in the centre comes above the tooltip.
                            wrapperStyle={{ zIndex: 1 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
                <div className="text-muted-foreground text-xs">{kind === "best" ? "Total Profit" : "Total Loss"}</div>

                <div className="text-lg font-semibold tabular-nums">{formatCurrency(total, { compact: true })}</div>
            </div>
        </Card>
    );
}

function Row({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>

            <span
                className={highlight ? "text-foreground font-medium tabular-nums" : "text-foreground/90 tabular-nums"}
            >
                {value}
            </span>
        </div>
    );
}

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;

    const d: SymbolsPerformanceItem = payload[0].payload;

    return (
        <div className="border-border-subtle bg-surface-3 min-w-[180px] rounded-lg border px-3 py-2.5 shadow-xl backdrop-blur">
            <div className="flex-x mb-2">
                <div className="font-medium">{d.symbol}</div>
                <div className="text-muted-foreground text-xs">
                    {new Decimal(d.contribution_percentage).toFixed(2)}%
                </div>
            </div>

            <div className="space-y-1 text-xs">
                <Row label="Net PnL" value={formatCurrency(d.net_pnl)} highlight />
                <Row label="Avg R" value={Number(d.avg_gross_r).toFixed(2)} />
                <Row label="Win rate" value={`${Number(d.win_rate).toFixed(1)}%`} />
                <Row label="Trades" value={d.positions_count} />
            </div>
        </div>
    );
}

function getTopSymbolsColumns(homeCurrency: CurrencyCode): ColumnDef<SymbolsPerformanceItem>[] {
    return [
        {
            accessorKey: "positions_count",
            header: ({ column }) => <DataTableColumnHeader title="# Trades" column={column} />,
            cell: ({ row }) => <span>{row.original.positions_count}</span>,
        },
        {
            accessorKey: "symbol",
            header: ({ column }) => <DataTableColumnHeader title="Symbol" column={column} />,
            cell: ({ row }) => <span className="font-medium">{row.original.symbol}</span>,
            enableHiding: false,
        },
        {
            accessorKey: "net_pnl",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Net PnL" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.net_pnl);
                return <PnL value={val}>{formatCurrency(val.toFixed(2), { currency: homeCurrency })}</PnL>;
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "gross_pnl",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Gross PnL" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.gross_pnl);
                return (
                    <span className="tabular-nums">{formatCurrency(val.toFixed(2), { currency: homeCurrency })}</span>
                );
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "win_rate",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Win %" column={column} />,
            cell: ({ row }) => <span className="tabular-nums">{Number(row.original.win_rate).toFixed(1)}%</span>,
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "avg_gross_r",
            header: ({ column }) => <DataTableColumnHeader align="right" title="Avg R" column={column} />,
            cell: ({ row }) => {
                const val = new Decimal(row.original.avg_gross_r);
                return <PnL value={val}>{formatCurrency(val.toFixed(2), { hideSymbol: true })}</PnL>;
            },
            sortingFn: decimalSortingFn,
        },
        {
            accessorKey: "efficiency",
            header: ({ column }) => (
                <DataTableColumnHeader
                    align="right"
                    title={
                        <span className="flex-x">
                            Eff % <EfficiencyInfoTooltip></EfficiencyInfoTooltip>
                        </span>
                    }
                    column={column}
                />
            ),
            cell: ({ row }) => {
                const val = Number(row.original.efficiency);
                return <span className="tabular-nums">{val ? `${(val * 100).toFixed(0)}%` : "—"}</span>;
            },
            sortingFn: decimalSortingFn,
        },
    ];
}

interface TopTradedSymbolsTableProps {
    data: SymbolsPerformanceItem[];
}

function TopTradedSymbolsTable(props: TopTradedSymbolsTableProps) {
    const { data } = props;

    const homeCurrency = useHomeCurrency();

    const rightAlignedColumns = ["net_pnl", "gross_pnl", "win_rate", "avg_gross_r", "efficiency"];

    return (
        <div>
            <h2 className="text-muted-foreground text-base font-medium">Most traded symbols</h2>
            <div className="h-2" />

            <DataTableSmart data={data} columns={getTopSymbolsColumns(homeCurrency)} total={data.length}>
                {(table) => (
                    <DataTable
                        table={table}
                        cellClassName={(cell) =>
                            rightAlignedColumns.includes(cell.column.id) ? "text-right tabular-nums" : ""
                        }
                    />
                )}
            </DataTableSmart>
        </div>
    );
}
