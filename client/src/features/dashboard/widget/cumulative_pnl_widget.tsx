import { FC, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { Card, CardTitle } from "@/components/card";

interface DataItem {
    label: string;
    pnl: number;
}

type Data = DataItem[];

interface Props {
    data: Data;
}

const gradientOffset = (data: Data) => {
    const dataMax = Math.max(...data.map((i) => i.pnl));
    const dataMin = Math.min(...data.map((i) => i.pnl));

    if (dataMax <= 0) {
        return 0;
    }
    if (dataMin >= 0) {
        return 1;
    }

    return dataMax / (dataMax - dataMin);
};

export const CumulativeNetPnLWidget: FC<Props> = ({ data }) => {
    const isMobile = useIsMobile();

    const off = useMemo(() => gradientOffset(data), [data]);

    return (
        <Card>
            <CardTitle>Cumulative Net PnL</CardTitle>

            <div className="h-4" />

            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
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
                        // Adding some buffer to the Y-axis
                        domain={[
                            (dataMin: number) =>
                                Math.floor(Math.min(0, dataMin * 1.15) / 1000) *
                                1000,
                            (dataMax: number) =>
                                Math.ceil((dataMax * 1.05) / 1000) * 1000,
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
                        <linearGradient
                            id="splitColor"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset={Math.min(0, off - 0.1)}
                                stopColor="var(--color-primary)"
                                stopOpacity={0.2}
                            />
                            <stop
                                offset={off}
                                stopColor="var(--color-primary)"
                                stopOpacity={0}
                            />
                            <stop
                                offset={off}
                                stopColor="var(--color-primary)"
                                stopOpacity={0}
                            />
                            <stop
                                offset={Math.min(1, off + 0.1)}
                                stopColor="var(--color-primary)"
                                stopOpacity={0.2}
                            />
                        </linearGradient>
                    </defs>

                    <ReferenceLine
                        y={0}
                        stroke="var(--color-foreground-muted)"
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        strokeOpacity={0.69}
                    />

                    <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="var(--color-primary)"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#splitColor)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};
