import { FC, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { axisDefaults, ChartContainer, ChartTooltipContent, tooltipCursor } from "netra";

import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { Card, CardTitle } from "@/components/card";
import { LoadingScreen } from "@/components/loading_screen";

interface DataItem {
    label: string;
    [tagName: string]: string | number;
}
type Data = DataItem[];

interface Tag {
    tag_name: string;
}

interface Props {
    data: Data;
    tags: Tag[];
    isLoading?: boolean;
    isResizable?: boolean;
}

// Dynamically generate chartConfig for tags
const chartConfig = (tags: Tag[]) =>
    tags.reduce(
        (acc, tag, idx) => {
            acc[tag.tag_name] = {
                label: tag.tag_name,
                color: `var(--color-chart-${(idx % 10) + 1})`,
            };
            return acc;
        },
        {} as Record<string, { label: string; color: string }>
    );

export const WidgetCumulativePnLLineChart: FC<Props> = ({ data, tags, isLoading, isResizable }) => {
    const isMobile = useIsMobile();

    const tagColors = useMemo(() => {
        return tags.reduce(
            (acc, tag, idx) => {
                acc[tag.tag_name] = `var(--color-chart-${(idx % 10) + 1})`;
                return acc;
            },
            {} as Record<string, string>
        );
    }, [tags]);

    return (
        <Card className="relative h-full w-full overflow-hidden">
            {isLoading && <LoadingScreen className="absolute-center" />}

            <CardTitle>Cumulative PnL</CardTitle>
            <div className="h-4" />

            <ChartContainer config={chartConfig(tags)}>
                <ResponsiveContainer width="100%" minHeight={300} height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: isResizable ? 80 : 0,
                            left: isMobile ? -10 : 0,
                        }}
                    >
                        <CartesianGrid stroke="var(--color-secondary-hover)" strokeOpacity={1} vertical={false} />
                        <XAxis dataKey="label" {...axisDefaults(isMobile)} />
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
                            cursor={tooltipCursor}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    formatter={(value) => formatCurrency(value as string)}
                                />
                            }
                        />
                        <Legend />
                        {tags.map((tag) => (
                            <Line
                                key={tag.tag_name}
                                type="monotone"
                                dataKey={tag.tag_name}
                                name={tag.tag_name}
                                stroke={tagColors[tag.tag_name]}
                                strokeWidth={1.5}
                                strokeOpacity={1}
                                fillOpacity={1}
                                dot={false}
                            />
                        ))}
                        <ReferenceLine
                            y={0}
                            stroke="var(--color-muted-foreground)"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                            strokeOpacity={0.5}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};

export default WidgetCumulativePnLLineChart;
