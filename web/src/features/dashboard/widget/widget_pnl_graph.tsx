import { FC } from "react";

import { axisDefaults, ChartConfig, ChartContainer, ChartTooltipContent, Checkbox, Label } from "netra";

import { Card, CardTitle } from "@/components/card";
import { LoadingScreen } from "@/components/loading_screen";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsMobile } from "@/hooks/use_is_mobile";
import {
    formatCurrency,
    LocalStorageKeyPnLShowCharges,
    LocalStorageKeyPnLShowGross,
    LocalStorageKeyPnLShowNet,
} from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/use_local_storage_state";

interface DataItem {
    label: string;
    net_pnl: number;
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

export const WidgetPnLGraph: FC<Props> = ({ data, isLoading, isResizable }) => {
    const [showNet, setShowNet] = useLocalStorageState(LocalStorageKeyPnLShowNet, true);
    const [showGross, setShowGross] = useLocalStorageState(LocalStorageKeyPnLShowGross, false);
    const [showCharges, setShowCharges] = useLocalStorageState(LocalStorageKeyPnLShowCharges, false);

    const isMobile = useIsMobile();

    return (
        <Card className="relative h-full w-full overflow-hidden">
            {isLoading && <LoadingScreen className="absolute-center" />}

            <CardTitle>PnL</CardTitle>

            <div className="h-2" />

            <div className="flex w-full justify-center gap-x-4 [&>div]:flex [&>div]:items-center [&>div]:gap-x-1">
                <div>
                    <Checkbox
                        id="pnl-graph-net"
                        checked={showNet}
                        onCheckedChange={() => setShowNet((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="pnl-graph-net">
                        Net
                    </Label>
                </div>

                <div>
                    <Checkbox
                        id="pnl-graph-gross"
                        checked={showGross}
                        onCheckedChange={() => setShowGross((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="pnl-graph-gross">
                        Gross
                    </Label>
                </div>

                <div>
                    <Checkbox
                        id="pnl-graph-charges"
                        checked={showCharges}
                        onCheckedChange={() => setShowCharges((prev) => !prev)}
                    />
                    <Label className="label-muted" htmlFor="pnl-graph-charges">
                        Charges
                    </Label>
                </div>
            </div>

            <div className="h-4" />

            <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" minHeight={300} height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: isResizable ? 80 : 0, // Adding this so that the chat doesn't overflow.
                            left: isMobile ? -10 : 0,
                        }}
                    >
                        <CartesianGrid stroke="var(--color-secondary-hover)" strokeOpacity={1} vertical={false} />
                        <XAxis {...axisDefaults(isMobile)} dataKey="label" />
                        <YAxis
                            {...axisDefaults(isMobile)}
                            tickFormatter={(value: number) =>
                                formatCurrency(value, {
                                    compact: true,
                                    hideSymbol: true,
                                })
                            }
                        />
                        <Tooltip
                            cursor={{ fill: "var(--color-secondary-hover)", fillOpacity: 0.5 }}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    formatter={(value) => formatCurrency(value as string)}
                                />
                            }
                        />

                        {showNet && <Bar dataKey="net_pnl" fill="var(--color-net-pnl)" />}
                        {showGross && <Bar dataKey="gross_pnl" fill="var(--color-gross-pnl)" />}
                        {showCharges && <Bar dataKey="charges" fill="var(--color-charges)" />}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};
