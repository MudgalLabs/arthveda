import { ReactNode, useEffect, useState } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Button,
    DataTable,
    DatePicker,
    Input,
    Label,
    Progress,
    Separator,
    Tag,
    Tooltip,
} from "@/s8ly";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { WithLabel } from "@/components/with_label";
import { useAddTrade } from "@/features/trade/add/add_trade_context";
import { OrderKindToggle } from "@/components/toggle/order_kind_toggle";
import {
    IconAlert,
    IconCalendarRange,
    IconPlus,
    IconTrash,
    IconTrendingDown,
    IconTrendingUp,
} from "@/components/icons";
import {
    getDataTableCellUpdateFn,
    useDataTableEditableCell,
} from "@/hooks/use_data_table_editable_cell";
import { OrderKind } from "@/features/trade/trade";
import { Card, CardTitle } from "@/components/card";
import { cn, formatDate, getElapsedTime, isSameDay } from "@/lib/utils";
import { SubTradeForAddRequest } from "@/lib/api/trade";

function AddTrade() {
    const { state, setState } = useAddTrade();

    return (
        <>
            <h1 className="heading">Add Trade</h1>

            <div className="h-3" />
            <Separator />
            <div className="h-6" />

            <div className="flex justify-between">
                <div className="flex gap-x-6">
                    <PnLCard />
                    <RFactorCard />
                    <DurationCard />
                </div>

                <div className="flex h-fit gap-x-2">
                    <DirectionTag />
                    <OutcomeTag />
                </div>
            </div>

            <div className="h-15" />

            <div className="flex items-center justify-between">
                <WithLabel Label={<Label>Symbol</Label>}>
                    <Input
                        type="text"
                        value={state.symbol}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                symbol: e.target.value,
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel Label={<Label>Instrument</Label>}>
                    <InstrumentToggle
                        value={state.instrument}
                        onChange={(value) =>
                            setState((prev) => ({
                                ...prev,
                                instrument: value,
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel Label={<Label>Planned Risk</Label>}>
                    <Input
                        type="number"
                        value={state.planned_risk_amount}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                planned_risk_amount: e.target.value,
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel Label={<Label>Charges</Label>}>
                    <Input
                        type="number"
                        value={state.charges_amount}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                charges_amount: e.target.value,
                            }))
                        }
                    />
                </WithLabel>
            </div>

            <div className="h-15" />

            <h2 className="sub-heading">Sub Trades</h2>

            <div className="h-4" />

            <SubTradesTable />

            <div className="h-8" />

            <div className="flex-center">
                <AddSubTradeButton />
            </div>

            <div className="h-10" />

            <div className="flex justify-end space-x-4">
                <Button variant="secondary">Discard</Button>
                <Button>Save</Button>
            </div>
        </>
    );
}

const columns: ColumnDef<SubTradeForAddRequest>[] = [
    {
        accessorKey: "order_kind",
        header: "Buy / Sell",
        cell: (ctx) => {
            const { value, syncWithValue } =
                useDataTableEditableCell<OrderKind>(ctx);
            return (
                <OrderKindToggle
                    value={value}
                    onChange={(v) => v && syncWithValue(v)}
                />
            );
        },
    },
    {
        accessorKey: "time",
        header: "Time",
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<Date>(ctx);
            const { subTrades } = useAddTrade();

            // We are subtracting `2` from length because `1` will be the last one.
            const secondLastSubTrade =
                subTrades[Math.min(subTrades.length - 2, 0)];

            // We don't want to apply a `minDate` if this is the first sub trade.
            const applyDateTimeRestrictions = ctx.row.index > 0;
            return (
                <DatePicker
                    time
                    dates={[value]}
                    onDatesChange={(dates) => setValue(dates[0])}
                    onClose={sync}
                    config={{
                        dates: {
                            minDate: applyDateTimeRestrictions
                                ? secondLastSubTrade.time
                                : undefined,
                        },
                        time: {
                            minTime:
                                // We wanna apply time restrictions only if we are on different sub trade
                                // and the date is not same as previous sub trade.
                                applyDateTimeRestrictions &&
                                isSameDay(value, secondLastSubTrade.time)
                                    ? {
                                          h: secondLastSubTrade.time.getHours(),
                                          m: secondLastSubTrade.time.getMinutes(),
                                      }
                                    : undefined,
                        },
                    }}
                />
            );
        },
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);

            useEffect(() => {
                setError(value === "");
            }, [value]);

            return (
                <Input
                    type="number"
                    variant={error ? "error" : "default"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={sync}
                />
            );
        },
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<string>(ctx);

            const [error, setError] = useState(false);

            useEffect(() => {
                setError(value === "");
            }, [value]);
            return (
                <Input
                    type="number"
                    variant={error ? "error" : "default"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={sync}
                />
            );
        },
    },
    {
        id: "delete",
        header: "",
        cell: ({ row }) => {
            const { removeSubTrade } = useAddTrade();
            return (
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeSubTrade(row.index)}
                >
                    <IconTrash className="text-foreground" size={20} />
                </Button>
            );
        },
    },
];

function SubTradesTable() {
    const { subTrades, setSubTrades } = useAddTrade();

    const table = useReactTable({
        columns,
        data: subTrades,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            updateFn:
                getDataTableCellUpdateFn<SubTradeForAddRequest>(setSubTrades),
        },
    });

    return <DataTable table={table} />;
}

function AddSubTradeButton() {
    const { subTradesAreValid, insertNewSubTrade } = useAddTrade();

    return (
        <Tooltip
            content={
                <div className="flex items-center gap-x-2">
                    <IconAlert size={18} />
                    <p>Sub Trades is missing some data</p>
                </div>
            }
            contentProps={{ side: "bottom" }}
            disabled={subTradesAreValid}
        >
            <Button
                variant="secondary"
                disabled={!subTradesAreValid}
                onClick={() => insertNewSubTrade()}
            >
                <IconPlus /> Add Sub Trade
            </Button>
        </Tooltip>
    );
}

function PnLCard() {
    const {
        processTradeResult: {
            net_pnl_amount,
            net_return_percentage,
            gross_pnl_amount,
            charges_as_percentage_of_net_pnl: cost_as_percentage_of_net_pnl,
        },
        state: { charges_amount },
    } = useAddTrade();

    let netPnLSign = "";
    let trendingIcon: ReactNode = null;
    let textColor = "text-foreground";
    const grossPnL = BigInt(gross_pnl_amount);
    const netPnL = BigInt(net_pnl_amount);

    if (netPnL > 0) {
        netPnLSign = "+";
        trendingIcon = <IconTrendingUp size={20} />;
        textColor = "text-foreground-green";
    } else if (netPnL < 0) {
        netPnLSign = "-";
        trendingIcon = <IconTrendingDown />;
        textColor = "text-foreground-red";
    }

    const tooltipContent = (
        <div className={`justify-between text-[12px]`}>
            <div className="flex gap-x-2">
                <p>
                    Gross{" "}
                    <span
                        className={cn({
                            "text-foreground-green": grossPnL > 0,
                            "text-foreground-red": grossPnL < 0,
                        })}
                    >
                        {grossPnL > 0 ? "+" : grossPnL < 0 ? "-" : ""}
                        {gross_pnl_amount}
                    </span>
                </p>
                <p>
                    Net{" "}
                    <span className={textColor}>
                        {netPnLSign}
                        {net_pnl_amount}
                    </span>{" "}
                </p>
            </div>

            <p>
                Charges{" "}
                <span className="text-foreground-red">-{charges_amount}</span>{" "}
                and{" "}
                <span className="text-foreground-red">
                    {cost_as_percentage_of_net_pnl}%
                </span>{" "}
                of Gross
            </p>
        </div>
    );

    return (
        <div className="flex flex-col gap-y-2">
            <CardTitle>PnL</CardTitle>
            <Card className="min-w-50">
                <div className={`flex items-end gap-x-2 ${textColor}`}>
                    <p
                        className={`font-heading text-[32px] leading-none font-bold`}
                    >
                        {netPnLSign} {net_pnl_amount}
                    </p>
                    <p>{net_return_percentage}%</p>
                    <p>{trendingIcon}</p>
                </div>

                <div className="h-4" />

                <Tooltip
                    content={tooltipContent}
                    contentProps={{
                        side: "bottom",
                        className: "min-w-(--radix-tooltip-trigger-width)",
                    }}
                >
                    <Progress value={100 - cost_as_percentage_of_net_pnl} />
                </Tooltip>
            </Card>
        </div>
    );
}

function RFactorCard() {
    const {
        processTradeResult: { r_factor },
    } = useAddTrade();

    let textColor = "";
    if (r_factor > 0) textColor = "text-foreground-green";
    if (r_factor < 0) textColor = "text-foreground-red";

    return (
        <div className="flex flex-col gap-y-2">
            <CardTitle>R Factor</CardTitle>
            <Card className="flex-center h-full min-w-25">
                <p className={`font-heading text-2xl font-bold ${textColor}`}>
                    {r_factor}
                </p>
            </Card>
        </div>
    );
}

function DurationCard() {
    const now = new Date();

    const {
        processTradeResult: { opened_at, closed_at },
    } = useAddTrade();

    const { days, hours, minutes } = getElapsedTime(
        opened_at,
        closed_at ?? now
    );

    return (
        <div className="flex flex-col gap-y-2">
            <CardTitle>R Factor</CardTitle>
            <Card className="flex h-full flex-col items-center gap-y-2">
                <p className="font-heading text-2xl font-bold">
                    {days} days {hours} hours {minutes} mins
                </p>

                <div className="text-foreground-muted flex items-center gap-x-1 text-sm">
                    <IconCalendarRange />
                    <div className="space-x-2">
                        <span>{formatDate(opened_at, { time: true })}</span>
                        <span>-</span>
                        <span>
                            {closed_at
                                ? formatDate(closed_at, { time: true })
                                : "trade is open"}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function DirectionTag() {
    const {
        processTradeResult: { direction },
    } = useAddTrade();
    return <Tag>{direction === "long" ? "Long" : "Short"}</Tag>;
}

function OutcomeTag() {
    const {
        processTradeResult: { outcome },
    } = useAddTrade();
    if (outcome === "win") return <Tag variant="success">Win</Tag>;
    if (outcome === "loss") return <Tag variant="destructive">Loss</Tag>;
    if (outcome === "breakeven") return <Tag variant="primary">Breakeven</Tag>;
    return <Tag variant="muted">Open</Tag>;
}

export default AddTrade;
