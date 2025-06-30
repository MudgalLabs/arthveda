import { ComponentType, createContext, ReactNode, useContext, useMemo } from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

interface ChartConfigOptions {
    label?: ReactNode;
    color?: string;
    icon?: ComponentType;
}

export type ChartConfig = {
    [k in string]: ChartConfigOptions;
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart() {
    const context = useContext(ChartContext);

    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }

    return context;
}

export function ChartContainer({ children, config }: { children: ReactNode; config: ChartConfig }) {
    return <ChartContext.Provider value={{ config }}>{children}</ChartContext.Provider>;
}

export function ChartTooltipContent({
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
        hideLabel?: boolean;
        hideIndicator?: boolean;
        indicator?: "line" | "dot" | "dashed";
        nameKey?: string;
        labelKey?: string;
    }) {
    const { config } = useChart();

    const tooltipLabel = useMemo(() => {
        if (hideLabel || !payload?.length) {
            return null;
        }

        const [item] = payload;
        const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const value =
            !labelKey && typeof label === "string"
                ? config[label as keyof typeof config]?.label || label
                : itemConfig?.label;

        if (labelFormatter) {
            return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
        }

        if (!value) {
            return null;
        }

        return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
        return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
        <div
            className={cn(
                "border-surface-border bg-surface-bg grid min-w-[8rem] items-start gap-1.5 rounded-md border px-2.5 py-1.5 text-sm shadow-xl",
                className
            )}
        >
            {!nestLabel ? tooltipLabel : null}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const key = `${nameKey || item.name || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);
                    const indicatorColor = color || item.payload.fill || item.color;

                    return (
                        <div
                            key={item.dataKey}
                            className={cn(
                                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                                indicator === "dot" && "items-center"
                            )}
                        >
                            {
                                <>
                                    {itemConfig?.icon ? (
                                        <itemConfig.icon />
                                    ) : (
                                        !hideIndicator && (
                                            <div
                                                className={cn(
                                                    "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                                                    {
                                                        "h-2.5 w-2.5": indicator === "dot",
                                                        "w-1": indicator === "line",
                                                        "w-0 border-[1.5px] border-dashed bg-transparent":
                                                            indicator === "dashed",
                                                        "my-0.5": nestLabel && indicator === "dashed",
                                                    }
                                                )}
                                                style={
                                                    {
                                                        "--color-bg": indicatorColor,
                                                        "--color-border": indicatorColor,
                                                    } as React.CSSProperties
                                                }
                                            />
                                        )
                                    )}
                                    <div
                                        className={cn(
                                            "flex flex-1 justify-between gap-x-2 leading-none",
                                            nestLabel ? "items-end" : "items-center"
                                        )}
                                    >
                                        <div className="grid gap-1.5">
                                            {nestLabel ? tooltipLabel : null}
                                            <span className="text-foreground-muted">
                                                {itemConfig?.label || item.name}
                                            </span>
                                        </div>
                                        {item.value && (
                                            <span className="text-foreground font-medium tabular-nums">
                                                {formatter && item?.value !== undefined && item.name
                                                    ? formatter(item.value, item.name, item, index, item.payload)
                                                    : item.value.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </>
                            }
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ChartLegendContent({
    className,
    hideIcon = false,
    payload,
    verticalAlign = "bottom",
    nameKey,
    onClick,
    classNames = {},
}: React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
        hideIcon?: boolean;
        nameKey?: string;
        onClick?: (dataKey: string) => void;
        classNames?: Record<keyof ChartConfig, string>;
    }) {
    const { config } = useChart();

    if (!payload?.length) {
        return null;
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center gap-4",
                verticalAlign === "top" ? "pb-3" : "pt-3",
                className
            )}
        >
            {payload.map((item) => {
                const key = `${nameKey || item.dataKey || "value"}`;
                const itemConfig = getPayloadConfigFromPayload(config, item, key);

                return (
                    <div
                        key={item.value}
                        className={cn(
                            "[&>svg]:text-foreground-muted flex items-center gap-1.5 text-sm [&>svg]:h-3 [&>svg]:w-3",
                            { "cursor-pointer": onClick },
                            classNames[item.value]
                        )}
                        onClick={() => onClick?.(item.dataKey as string)}
                    >
                        {itemConfig?.icon && !hideIcon ? (
                            <itemConfig.icon />
                        ) : (
                            <div
                                className="h-2 w-2 shrink-0 rounded-[2px]"
                                style={{
                                    backgroundColor: item.color,
                                }}
                            />
                        )}
                        {itemConfig?.label}
                    </div>
                );
            })}
        </div>
    );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }

    const payloadPayload =
        "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
            ? payload.payload
            : undefined;

    let configLabelKey: string = key;

    if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
        configLabelKey = payload[key as keyof typeof payload] as string;
    } else if (
        payloadPayload &&
        key in payloadPayload &&
        typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
    ) {
        configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
    }

    return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export const tooltipCursor = {
    stroke: "var(--color-primary)",
    strokeWidth: 1,
    strokeOpacity: 0.25,
};

export const axisDefaults = (isMobile?: boolean) => ({
    tick: {
        fill: "var(--color-foreground-muted)",
        fontSize: isMobile ? 10 : 14,
    },
    tickMargin: 5,
    tickLine: false,
    axisLine: false,
});
