import { FC } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import {
    formatCurrency,
    LocalStorageKeyCumulativePnLShowCharges,
    LocalStorageKeyCumulativePnLShowGross,
    LocalStorageKeyCumulativePnLShowNet,
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

const chartConfig: ChartConfig = {
    net_pnl: {
        label: "Net",
        color: "var(--color-net-pnl)",
    },
    gross_pnl: {
        label: "Gross",
        color: "var(--color-gross-pnl)",
    },
    charges: {
        label: "Charges",
        color: "var(--color-charges)",
    },
};

export const WidgetCumulativePnLGraph: FC<Props> = ({ data, isLoading, isResizable }) => {
    const [showNet, setShowNet] = useLocalStorageState(LocalStorageKeyCumulativePnLShowNet, true);
    const [showGross, setShowGross] = useLocalStorageState(LocalStorageKeyCumulativePnLShowGross, false);
    const [showCharges, setShowCharges] = useLocalStorageState(LocalStorageKeyCumulativePnLShowCharges, false);

    const isMobile = useIsMobile();
    return (
        <Card className="relative h-full w-full overflow-hidden">
            {isLoading && <LoadingScreen className="absolute-center" />}

            <CardTitle>Cumulative PnL</CardTitle>

            <div className="h-2" />

            <div className="flex w-full justify-center gap-x-4 [&>div]:flex [&>div]:items-center [&>div]:gap-x-1">
                <div>
                    <Checkbox
                        id="cumulative-pnl-graph-net"
                        checked={showNet}
                        onCheckedChange={() => setShowNet((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="cumulative-pnl-graph-net">
                        Net
                    </Label>
                </div>

                <div>
                    <Checkbox
                        id="cumulative-pnl-graph-gross"
                        checked={showGross}
                        onCheckedChange={() => setShowGross((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="cumulative-pnl-graph-gross">
                        Gross
                    </Label>
                </div>

                <div>
                    <Checkbox
                        id="cumulative-pnl-graph-charges"
                        checked={showCharges}
                        onCheckedChange={() => setShowCharges((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="cumulative-pnl-graph-charges">
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
                            <linearGradient id="splitColorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-net-pnl)" stopOpacity="0.25" />
                                <stop offset="40%" stopColor="var(--color-net-pnl)" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="var(--color-net-pnl)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {showNet && (
                            <Area
                                type="monotone"
                                dataKey="net_pnl"
                                stroke="var(--color-net-pnl)"
                                strokeWidth={2}
                                strokeOpacity={1}
                                fillOpacity={1}
                                fill="url(#splitColorNet)"
                            />
                        )}

                        <defs>
                            <linearGradient id="splitColorGross" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-gross-pnl)" stopOpacity="0.25" />
                                <stop offset="40%" stopColor="var(--color-gross-pnl)" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="var(--color-gross-pnl)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {showGross && (
                            <Area
                                type="monotone"
                                dataKey="gross_pnl"
                                stroke="var(--color-gross-pnl)"
                                strokeWidth={1.5}
                                strokeOpacity={0.7}
                                fillOpacity={1}
                                fill="url(#splitColorGross)"
                            />
                        )}

                        <defs>
                            <linearGradient id="splitColorCharges" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-charges)" stopOpacity="0.25" />
                                <stop offset="40%" stopColor="var(--color-charges)" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="var(--color-charges)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {showCharges && (
                            <Area
                                type="monotone"
                                dataKey="charges"
                                stroke="var(--color-charges)"
                                strokeWidth={1.5}
                                strokeOpacity={0.7}
                                fillOpacity={1}
                                fill="url(#splitColorCharges)"
                            />
                        )}
                        <ReferenceLine
                            y={0}
                            stroke="var(--color-muted-foreground)"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                            strokeOpacity={1}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};

export default WidgetCumulativePnLGraph;
