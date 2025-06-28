import { FC, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import {
    formatCurrency,
    LocalStorageKeyCumulativePnLShowCharges,
    LocalStorageKeyCumulativePnLShowGross,
} from "@/lib/utils";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { Card, CardTitle } from "@/components/card";
import { LoadingScreen } from "@/components/loading_screen";
import { ChartConfig, ChartContainer, ChartTooltipContent, tooltipCursor, axisDefaults, Checkbox, Label } from "@/s8ly";
import { useLocalStorageState } from "@/hooks/use_local_storage_state";

interface DataItem {
    label: string;
    net_pnl: number;
    gross_pnl: number;
    charges: number;
}

type Data = DataItem[];

interface Props {
    data: Data;
    isLoading?: boolean;
    isResizable?: boolean;
}

const gradientOffset = (data: Data) => {
    const dataMax = Math.max(...data.map((i) => i.net_pnl));
    const dataMin = Math.min(...data.map((i) => i.net_pnl));

    if (dataMax <= 0) {
        return 0;
    }
    if (dataMin >= 0) {
        return 1;
    }

    return dataMax / (dataMax - dataMin);
};

const chartConfig: ChartConfig = {
    net_pnl: {
        label: "Net",
        color: "var(--color-primary)",
    },
    gross_pnl: {
        label: "Gross",
        color: "var(--color-primary)",
    },
    charges: {
        label: "Charges",
        color: "var(--color-error-foreground)",
    },
};

export const CumulativePnLCurve: FC<Props> = ({ data, isLoading, isResizable }) => {
    const [showGross, setShowGross] = useLocalStorageState(LocalStorageKeyCumulativePnLShowGross, false);
    const [showCharges, setShowCharges] = useLocalStorageState(LocalStorageKeyCumulativePnLShowCharges, false);

    const isMobile = useIsMobile();
    const off = useMemo(() => gradientOffset(data), [data]);

    return (
        <Card className="relative h-full w-full overflow-hidden">
            {isLoading && <LoadingScreen className="absolute-center" />}

            <CardTitle>Cumulative PnL Curve</CardTitle>

            <div className="h-2" />

            <div className="flex w-full justify-center gap-x-4 [&>div]:flex [&>div]:items-center [&>div]:gap-x-1">
                <div>
                    <Checkbox id="gross" checked={showGross} onCheckedChange={() => setShowGross((prev) => !prev)} />
                    <Label className="label-muted" htmlFor="gross">
                        Gross
                    </Label>
                </div>

                <div>
                    <Checkbox
                        id="charges"
                        checked={showCharges}
                        onCheckedChange={() => setShowCharges((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="charges">
                        Charges
                    </Label>
                </div>
            </div>

            <div className="h-4" />

            <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" minHeight={300} height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: isResizable ? 80 : 0, // Adding this so that the chat doesn't overflow.
                            left: isMobile ? -10 : 0,
                        }}
                    >
                        <CartesianGrid stroke="var(--color-primary)" strokeOpacity={0.3} vertical={false} />

                        <XAxis {...axisDefaults(isMobile)} dataKey="label" />

                        <YAxis
                            {...axisDefaults(isMobile)}
                            // Adding some buffer to the Y-axis
                            domain={[
                                (dataMin: number) => Math.floor(Math.min(0, dataMin * 1.15) / 1000) * 1000,
                                (dataMax: number) => Math.ceil((dataMax * 1.05) / 1000) * 1000,
                            ]}
                            tickFormatter={(value: number) =>
                                formatCurrency(value, {
                                    compact: true,
                                    hideSymbol: true,
                                })
                            }
                        />

                        <Tooltip
                            cursor={tooltipCursor}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    formatter={(value) => formatCurrency(value as string)}
                                />
                            }
                        />

                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset={Math.min(0, off - 0.1)}
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0.2}
                                />
                                <stop offset={off} stopColor="var(--color-primary)" stopOpacity={0} />
                                <stop offset={off} stopColor="var(--color-primary)" stopOpacity={0} />
                                <stop
                                    offset={Math.min(1, off + 0.1)}
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0.2}
                                />
                            </linearGradient>
                        </defs>

                        <ReferenceLine
                            y={0}
                            stroke="var(--color-border-red)"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            strokeOpacity={1}
                        />

                        <Area
                            type="monotone"
                            dataKey="net_pnl"
                            stroke="var(--color-primary)"
                            strokeWidth={1.5}
                            strokeOpacity={1}
                            fillOpacity={1}
                            fill="url(#splitColor)"
                        />

                        {showGross && (
                            <Area
                                type="monotone"
                                dataKey="gross_pnl"
                                stroke="var(--color-success-foreground)"
                                strokeWidth={1}
                                strokeOpacity={1}
                                fillOpacity={0}
                            />
                        )}

                        {showCharges && (
                            <Area
                                type="monotone"
                                dataKey="charges"
                                stroke="var(--color-error-foreground)"
                                strokeWidth={1}
                                strokeOpacity={1}
                                fillOpacity={0}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};

export default CumulativePnLCurve;
