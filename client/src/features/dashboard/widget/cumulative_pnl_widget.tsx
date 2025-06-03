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
                <AreaChart
                    data={data}
                    margin={{
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: isMobile ? -10 : 0,
                    }}
                >
                    <CartesianGrid
                        stroke="var(--color-primary)"
                        strokeOpacity={0.3}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{
                            fill: "var(--color-foreground-muted)",
                            fontSize: isMobile ? 10 : 14,
                        }}
                        tickMargin={5}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[
                            (dataMin: number) =>
                                Math.floor(Math.min(0, dataMin * 1.1) / 1000) *
                                3000,
                            (dataMax: number) =>
                                Math.ceil(dataMax / 1000) * 1000,
                        ]}
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
                        tickMargin={5}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "6px",
                            background: "var(--color-surface-bg)",
                            borderColor: "var(--color-surface-border)",
                            color: "var(--color-foreground)",
                        }}
                        cursor={{
                            stroke: "var(--color-primary)",
                            strokeWidth: 1,
                            strokeOpacity: 0.25,
                        }}
                        separator=" "
                        formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                        ]}
                    />
                    <defs>
                        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0.1}
                            />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="var(--color-primary)"
                        strokeWidth={1.5}
                        fill="url(#fill)"
                        fillOpacity={0.1}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};
