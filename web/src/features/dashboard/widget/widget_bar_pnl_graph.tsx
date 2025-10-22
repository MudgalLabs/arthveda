import { FC } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisDefaults, ChartConfig, ChartContainer, ChartTooltipContent } from "netra";

import { Card, CardTitle } from "@/components/card";
import { LoadingScreen } from "@/components/loading_screen";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { formatCurrency } from "@/lib/utils";

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
};

export const WidgetBarPnLGraph: FC<Props> = ({ data, isLoading, isResizable }) => {
    const isMobile = useIsMobile();

    return (
        <Card className="relative h-full w-full overflow-hidden">
            {isLoading && <LoadingScreen className="absolute-center" />}

            <CardTitle>PnL</CardTitle>

            <div className="h-4" />

            <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" minHeight={300} height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: isResizable ? 80 : 0,
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
                        <Bar dataKey="net_pnl" fill="var(--color-net-pnl)" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};

export default WidgetBarPnLGraph;
