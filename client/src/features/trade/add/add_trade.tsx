import { memo, ReactNode, useEffect, useMemo, useState } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Button,
    DataTable,
    DatePicker,
    Dialog,
    DialogFooter,
    DialogHeader,
    Input,
    Label,
    Progress,
    Separator,
    Tag,
    Tooltip,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/s8ly";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { WithLabel } from "@/components/with_label";
import {
    SubTrade,
    Trade,
    useAddTrade,
} from "@/features/trade/add/add_trade_context";
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
import {
    CurrencyKind,
    DirectionKind,
    OrderKind,
    OutcomeKind,
} from "@/features/trade/trade";
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
import { useWrappedState } from "@/hooks/use_wrapped_state";

function AddTrade() {
    const {
        state,
        setState,
        isComputing,
        showDiscardWarning,
        discard,
        subTrades,
        setSubTrades,
        subTradesAreValid,
        insertNewSubTrade,
        computeForAddResult,
    } = useAddTrade();

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
                <PnLCard
                    charges_amount={state.charges_amount}
                    charges_as_percentage_of_net_pnl={
                        computeForAddResult.charges_as_percentage_of_net_pnl
                    }
                    currency={state.currency}
                    gross_pnl_amount={computeForAddResult.gross_pnl_amount}
                    net_pnl_amount={computeForAddResult.net_pnl_amount}
                    net_return_percentage={
                        computeForAddResult.net_return_percentage
                    }
                />
                <RFactorCard r_factor={computeForAddResult.r_factor} />
                <DurationCard
                    opened_at={computeForAddResult.opened_at}
                    closed_at={computeForAddResult.closed_at}
                />

                <div className="flex items-end">
                    <div className="flex h-fit gap-x-2">
                        <DirectionTag
                            direction={computeForAddResult.direction}
                        />
                        <OutcomeTag
                            currency={state.currency}
                            outcome={computeForAddResult.outcome}
                            open_price={computeForAddResult.open_price}
                            open_quantity={computeForAddResult.open_quantity}
                        />
                    </div>
                </div>
            </div>

            <div className="h-15" />

            <div className="flex items-center justify-between">
                <SymbolInput value={state.symbol} setState={setState} />

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

                <PlannedRiskInput
                    currency={state.currency}
                    value={state.planned_risk_amount}
                    setState={setState}
                />

                <ChargesInput
                    currency={state.currency}
                    value={state.charges_amount}
                    setState={setState}
                />
            </div>

            <div className="h-15" />

            <h2 className="sub-heading">Sub Trades</h2>

            <div className="h-4" />

            <SubTradesTable subTrades={subTrades} setSubTrades={setSubTrades} />

            <div className="h-8" />

            <div className="flex-center">
                <AddSubTradeButton
                    subTradesAreValid={subTradesAreValid}
                    insertNewSubTrade={insertNewSubTrade}
                />
            </div>

            <div className="h-10" />

            <div className="flex justify-end space-x-4">
                <DiscardButton
                    showDiscardWarning={showDiscardWarning}
                    discard={discard}
                />
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

const SubTradesTable = memo(
    ({
        subTrades,
        setSubTrades,
    }: {
        subTrades: SubTrade[];
        setSubTrades: React.Dispatch<React.SetStateAction<SubTrade[]>>;
    }) => {
        const updateFn = useMemo(
            () => getDataTableCellUpdateFn<SubTrade>(setSubTrades),
            []
        );

        const table = useReactTable({
            columns,
            data: subTrades,
            getCoreRowModel: getCoreRowModel(),
            meta: {
                updateFn,
            },
        });

        return <DataTable table={table} />;
    }
);

const AddSubTradeButton = memo(
    ({
        subTradesAreValid,
        insertNewSubTrade,
    }: {
        subTradesAreValid: boolean;
        insertNewSubTrade: () => void;
    }) => {
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
);

const PnLCard = memo(
    ({
        charges_amount,
        charges_as_percentage_of_net_pnl,
        currency,
        gross_pnl_amount,
        net_pnl_amount,
        net_return_percentage,
    }: {
        net_pnl_amount: string;
        net_return_percentage: number;
        gross_pnl_amount: string;
        charges_as_percentage_of_net_pnl: number;
        currency: CurrencyKind;
        charges_amount: string;
    }) => {
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
                            {charges_as_percentage_of_net_pnl}%
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
                                    value={
                                        100 - charges_as_percentage_of_net_pnl
                                    }
                                />
                            </Tooltip>
                        </div>
                    )}
                </Card>
            </div>
        );
    }
);

const RFactorCard = memo(({ r_factor }: { r_factor: number }) => {
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
});

const DurationCard = memo(
    ({ opened_at, closed_at }: { opened_at: Date; closed_at: Date | null }) => {
        const now = new Date();

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
                            {closed_at && (
                                <span>
                                    - {formatDate(closed_at, { time: true })}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
);

const DirectionTag = memo(({ direction }: { direction: DirectionKind }) => {
    const isLong = direction === "long";
    return (
        <Tag variant={isLong ? "success" : "destructive"}>
            {isLong ? "Long" : "Short"}
        </Tag>
    );
});

const OutcomeTag = memo(
    ({
        currency,
        outcome,
        open_quantity,
        open_price,
    }: {
        currency: CurrencyKind;
        outcome: OutcomeKind;
        open_quantity: string;
        open_price: string;
    }) => {
        if (outcome === "win") return <Tag variant="success">Win</Tag>;
        if (outcome === "loss") return <Tag variant="destructive">Loss</Tag>;
        if (outcome === "breakeven")
            return <Tag variant="primary">Breakeven</Tag>;

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
);

const SymbolInput = memo(
    ({
        value: valueProp,
        setState,
    }: {
        value: string;
        setState: React.Dispatch<React.SetStateAction<Trade>>;
    }) => {
        const [value, setValue] = useWrappedState<string>(valueProp);

        return (
            <WithLabel Label={<Label>Symbol</Label>}>
                <Input
                    type="text"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() =>
                        value !== valueProp &&
                        setState((prev) => ({
                            ...prev,
                            symbol: value,
                        }))
                    }
                />
            </WithLabel>
        );
    }
);

const PlannedRiskInput = memo(
    ({
        currency,
        value: valueProp,
        setState,
    }: {
        currency: CurrencyKind;
        value: string;
        setState: React.Dispatch<React.SetStateAction<Trade>>;
    }) => {
        const [value, setValue] = useWrappedState<string>(valueProp);
        return (
            <WithLabel Label={<Label>Planned Risk</Label>}>
                <CurrencyInput
                    currency={currency}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() =>
                        value !== valueProp &&
                        setState((prev) => ({
                            ...prev,
                            planned_risk_amount: value,
                        }))
                    }
                />
            </WithLabel>
        );
    }
);

const ChargesInput = memo(
    ({
        currency,
        value: valueProp,
        setState,
    }: {
        currency: CurrencyKind;
        value: string;
        setState: React.Dispatch<React.SetStateAction<Trade>>;
    }) => {
        const [value, setValue] = useWrappedState<string>(valueProp);
        return (
            <WithLabel Label={<Label>Charges</Label>}>
                <CurrencyInput
                    currency={currency}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() =>
                        value !== valueProp &&
                        setState((prev) => ({
                            ...prev,
                            charges_amount: value,
                        }))
                    }
                />
            </WithLabel>
        );
    }
);

const DiscardButton = memo(
    ({
        showDiscardWarning,
        discard,
    }: {
        showDiscardWarning: boolean;
        discard: () => void;
    }) => {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" disabled={!showDiscardWarning}>
                        Discard
                    </Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disacard the trade you were
                            adding?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => discard()}
                            >
                                Discard
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

export default AddTrade;
