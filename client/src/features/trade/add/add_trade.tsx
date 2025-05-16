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
import {
    cn,
    formatCurrency,
    formatDate,
    getElapsedTime,
    isSameDay,
} from "@/lib/utils";
import { SubTradeForAddRequest } from "@/lib/api/trade";
import { Loading } from "@/components/loading";
import { CurrencySelect } from "@/components/select/currency_select";
import { CurrencyInput } from "@/components/input/currency_input";

function AddTrade() {
    const { state, setState, isComputing } = useAddTrade();

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex gap-x-2">
                    <h1 className="heading">Add Trade</h1>
                    <div>{isComputing && <Loading />}</div>
                </div>

                <div>
                    <CurrencySelect
                        classNames={{ trigger: "w-fit" }}
                        defaultValue={state.currency}
                    />
                </div>
            </div>

            <div className="h-3" />
            <Separator />
            <div className="h-6" />

            <div className="flex gap-x-6">
                <PnLCard />
                <RFactorCard />
                <DurationCard />

                <div className="flex items-end">
                    <div className="flex h-fit gap-x-2">
                        <DirectionTag />
                        <OutcomeTag />
                    </div>
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
                    <CurrencyInput
                        currency={state.currency}
                        onBlur={(e) =>
                            setState((prev) => ({
                                ...prev,
                                planned_risk_amount: e.target.value,
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel Label={<Label>Charges</Label>}>
                    <CurrencyInput
                        currency={state.currency}
                        onBlur={(e) =>
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
                setError(Number(value) === 0);
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
            const { state } = useAddTrade();
            const { value, setValue, sync } =
                useDataTableEditableCell<string>(ctx);

            const [error, setError] = useState(false);

            useEffect(() => {
                setError(Number(value) === 0);
            }, [value]);

            return (
                <CurrencyInput
                    currency={state.currency}
                    variant={error ? "error" : "default"}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={sync}
                />
            );
        },
    },
    {
        id: "delete",
        header: "",
        cell: ({ row, table }) => {
            const { removeSubTrade } = useAddTrade();
            // We want to disable this button if we have only 1 sub trade (rows count = 1).
            const disableButton = table.getRowModel().rows.length === 1;
            return (
                <Tooltip
                    content="There must be a Sub Trade"
                    contentProps={{ side: "bottom" }}
                    disabled={!disableButton}
                >
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSubTrade(row.index)}
                        disabled={disableButton}
                    >
                        <IconTrash className="text-foreground" size={20} />
                    </Button>
                </Tooltip>
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
                <div className="flex-center gap-x-2">
                    <IconAlert size={18} />
                    <p>Sub Trades missing some data</p>
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
        computeForAddResult: {
            net_pnl_amount,
            net_return_percentage,
            gross_pnl_amount,
            charges_as_percentage_of_net_pnl: cost_as_percentage_of_net_pnl,
        },
        state: { currency, charges_amount },
    } = useAddTrade();

    let trendingIcon: ReactNode = null;
    let textColor = "text-foreground";
    const grossPnL = BigInt(gross_pnl_amount);
    const netPnL = BigInt(net_pnl_amount);

    if (netPnL > 0) {
        trendingIcon = <IconTrendingUp size={20} />;
        textColor = "text-foreground-green";
    } else if (netPnL < 0) {
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
                        {formatCurrency(gross_pnl_amount, currency)}
                    </span>
                </p>
                <p>
                    Net{" "}
                    <span className={textColor}>
                        {formatCurrency(net_pnl_amount, currency)}
                    </span>{" "}
                </p>
            </div>

            {Number(charges_amount) > 0 && (
                <p>
                    Charges{" "}
                    <span className="text-foreground-red">
                        {formatCurrency(charges_amount, currency)}
                    </span>{" "}
                    and{" "}
                    <span className="text-foreground-red">
                        {cost_as_percentage_of_net_pnl}%
                    </span>{" "}
                    of Gross
                </p>
            )}
        </div>
    );

    return (
        <div className="flex min-w-80 flex-col gap-y-2">
            <CardTitle>PnL</CardTitle>
            <Card className="flex h-full min-w-50 flex-col items-start justify-center">
                <div className={`flex items-end gap-x-2 ${textColor}`}>
                    <p
                        className={`font-heading text-[32px] leading-none font-bold`}
                    >
                        {formatCurrency(net_pnl_amount, currency)}
                    </p>
                    <p>{net_return_percentage}%</p>
                    <p>{trendingIcon}</p>
                </div>

                {Number(net_pnl_amount) > 0 && (
                    <div className="w-full">
                        <div className="h-4" />
                        <Tooltip
                            content={tooltipContent}
                            contentProps={{
                                side: "bottom",
                                className:
                                    "min-w-(--radix-tooltip-trigger-width)",
                            }}
                        >
                            <Progress
                                value={100 - cost_as_percentage_of_net_pnl}
                            />
                        </Tooltip>
                    </div>
                )}
            </Card>
        </div>
    );
}

function RFactorCard() {
    const {
        computeForAddResult: { r_factor },
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
        computeForAddResult: { opened_at, closed_at },
    } = useAddTrade();

    const { days, hours, minutes } = getElapsedTime(
        opened_at,
        closed_at ?? now
    );

    return (
        <div className="flex flex-col gap-y-2">
            <CardTitle>Duration</CardTitle>
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
        computeForAddResult: { direction },
    } = useAddTrade();
    const isLong = direction === "long";
    return (
        <Tag variant={isLong ? "success" : "destructive"}>
            {isLong ? "Long" : "Short"}
        </Tag>
    );
}

function OutcomeTag() {
    const {
        computeForAddResult: { outcome, open_quantity, open_price },
        state: { currency },
    } = useAddTrade();
    if (outcome === "win") return <Tag variant="success">Win</Tag>;
    if (outcome === "loss") return <Tag variant="destructive">Loss</Tag>;
    if (outcome === "breakeven") return <Tag variant="primary">Breakeven</Tag>;

    let openTagContent = "Open";

    if (Number(open_quantity) > 0) {
        openTagContent +=
            " ~ Qty: " +
            open_quantity +
            " Avg: " +
            formatCurrency(open_price, currency);
    }

    return <Tag variant="muted">{openTagContent}</Tag>;
}

export default AddTrade;
