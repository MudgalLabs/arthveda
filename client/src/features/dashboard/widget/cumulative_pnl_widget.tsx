import { FC } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { Card, CardTitle } from "@/components/card";

interface DataItem {
    label: string;
    pnl: number;
}

interface Props {
    data: DataItem[];
}

export const CumulativeNetPnLWidget: FC<Props> = ({ data }) => {
    const isMobile = useIsMobile();

    return (
        <Card>
            <CardTitle>Cumulative Net PnL</CardTitle>

            <div className="h-4" />

            <ResponsiveContainer width="100%" height={isMobile ? 250 : 500}>
                <AreaChart data={data}>
                    <CartesianGrid
                        stroke="var(--color-primary)"
                        strokeOpacity={0.15}
                        strokeDasharray="3 3"
                    />
                    <XAxis
                        dataKey="label"
                        tick={{
                            fill: "var(--color-foreground-muted)",
                            fontSize: isMobile ? 10 : 14,
                        }}
                        tickLine={false}
                        axisLine={{
                            stroke: "var(--color-accent)",
                            strokeWidth: 1,
                        }}
                    />
                    <YAxis
                        tickFormatter={(value: number) =>
                            formatCurrency(value, {
                                compact: true,
                                hideSymbol: true,
                            })
                        }
                        tick={{
                            fill: "var(--color-foreground-muted)",
                            fontSize: isMobile ? 10 : 14,
                        }}
                        tickLine={false}
                        axisLine={{
                            stroke: "var(--color-accent)",
                            strokeWidth: 1,
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "var(--color-surface-bg)",
                            borderColor: "var(--color-surface-border)",
                            borderRadius: "6px",
                            color: "var(--color-foreground)",
                        }}
                        formatter={(value: number) => [
                            formatCurrency(value),
                            "PnL",
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="var(--color-primary)"
                        strokeWidth={1.5}
                        fill="var(--color-primary)"
                        fillOpacity={0.1}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};
