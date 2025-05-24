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
    State,
    useAddPosition,
} from "@/features/position/add/add_position_context";
import { OrderKindToggle } from "@/components/toggle/trade_kind_toggle";
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
import { CurrencyCode } from "@/features/position/position";
import { Card, CardTitle } from "@/components/card";
import {
    cn,
    formatCurrency,
    formatDate,
    getElapsedTime,
    isSameDay,
} from "@/lib/utils";
import { CurrencySelect } from "@/components/select/currency_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { useWrappedState } from "@/hooks/use_wrapped_state";
import { NewTrade, TradeKind } from "@/features/trade/trade";
import { apiHooks } from "@/hooks/api_hooks";
import { toast } from "@/components/toast";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { PageHeading } from "@/components/page_heading";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";
import { apiErrorHandler } from "@/lib/api";
import { DecimalString } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";

function AddPosition() {
    const {
        state,
        setState,
        isComputing,
        showDiscardWarning,
        discard,
        trades,
        setTrades,
        tradesAreValid,
        insertNewTrade,
        computeResult,
        canSave,
    } = useAddPosition();

    const queryClient = useQueryClient();

    const { mutateAsync: save, isPending: isSaving } =
        apiHooks.position.useCreate({
            onSuccess: async () => {
                toast.success("Position Created", {
                    description: (
                        <p>
                            Go to{" "}
                            <Link
                                to={ROUTES.positionList}
                                className="text-inherit!"
                            >
                                Positions Tab
                            </Link>{" "}
                            to see your positions
                        </p>
                    ),
                });

                discard();
                queryClient.invalidateQueries({
                    queryKey: ["useGetDashboard"],
                });
            },
            onError: apiErrorHandler,
        });

    const handleClickSave = () => {
        if (!canSave) return;

        save({
            risk_amount: state.risk_amount || "0",
            charges_amount: state.charges_amount || "0",
            symbol: state.symbol,
            instrument: state.instrument,
            currency: state.currency,
            trades: trades.map((t) => {
                // @ts-ignore
                delete t.id;
                return t;
            }),
        });
    };

    return (
        <>
            <PageHeading heading="Add Position" loading={isComputing} />

            <div className="flex gap-x-6">
                <PnLCard
                    charges_amount={state.charges_amount}
                    charges_as_percentage_of_net_pnl={
                        computeResult.charges_as_percentage_of_net_pnl
                    }
                    currency={state.currency}
                    gross_pnl_amount={computeResult.gross_pnl_amount}
                    net_pnl_amount={computeResult.net_pnl_amount}
                    net_return_percentage={computeResult.net_return_percentage}
                />
                <RFactorCard r_factor={computeResult.r_factor} />
                <DurationCard
                    opened_at={computeResult.opened_at}
                    closed_at={computeResult.closed_at}
                />

                <div className="flex items-end">
                    <div className="flex h-fit gap-x-2">
                        <DirectionTag direction={computeResult.direction} />
                        <StatusTag
                            currency={state.currency}
                            status={computeResult.status}
                            openAvgPrice={
                                computeResult.open_average_price_amount
                            }
                            openQuantity={computeResult.open_quantity}
                        />
                    </div>
                </div>

                <div className="ml-auto">
                    <CurrencySelect
                        classNames={{ trigger: "w-fit" }}
                        defaultValue={state.currency}
                    />
                </div>
            </div>

            <div className="h-15" />

            <div className="flex items-center justify-between">
                <SymbolInput value={state.symbol} setState={setState} />

                <WithLabel Label={<Label>Instrument</Label>}>
                    <InstrumentToggle
                        value={state.instrument}
                        onChange={(value) =>
                            value &&
                            setState((prev) => ({
                                ...prev,
                                instrument: value,
                            }))
                        }
                    />
                </WithLabel>

                <RiskInput
                    currency={state.currency}
                    value={state.risk_amount}
                    setState={setState}
                />

                <ChargesInput
                    currency={state.currency}
                    value={state.charges_amount}
                    setState={setState}
                />
            </div>

            <div className="h-15" />

            <h2 className="sub-heading">Trades</h2>

            <div className="h-4" />

            <TradesTable trades={trades} setTrades={setTrades} />

            <div className="h-8" />

            <div className="flex-center">
                <AddTradeButton
                    tradesAreValid={tradesAreValid}
                    insertNewTrade={insertNewTrade}
                />
            </div>

            <div className="h-10" />

            <div className="flex justify-end space-x-4">
                <DiscardButton
                    showDiscardWarning={showDiscardWarning}
                    discard={discard}
                />

                <Button
                    onClick={handleClickSave}
                    loading={isSaving}
                    disabled={!canSave}
                >
                    Save
                </Button>
            </div>
        </>
    );
}

export default AddPosition;

const columns: ColumnDef<NewTrade>[] = [
    {
        accessorKey: "kind",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Buy / Sell" />
        ),
        cell: (ctx) => {
            const { value, syncWithValue } =
                useDataTableEditableCell<TradeKind>(ctx);
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Time" />
        ),
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<Date>(ctx);
            const { trades } = useAddPosition();

            // We are subtracting `2` from length because `1` will be the last one.
            const secondLastTrade = trades[Math.min(trades.length - 2, 0)];

            // We don't want to apply a `minDate` if this is the first trade.
            const applyDateTimeRestrictions = ctx.row.index > 0;
            const now = new Date();

            return (
                <DatePicker
                    time
                    dates={[value]}
                    onDatesChange={(dates) => setValue(dates[0])}
                    onClose={sync}
                    config={{
                        dates: {
                            minDate: applyDateTimeRestrictions
                                ? secondLastTrade.time
                                : undefined,
                            maxDate: now,
                        },
                        time: {
                            minTime:
                                // We wanna apply time restrictions only if we are on different trade
                                // and the date is not same as previous trade.
                                applyDateTimeRestrictions &&
                                isSameDay(value, secondLastTrade.time)
                                    ? {
                                          h: secondLastTrade.time.getHours(),
                                          m: secondLastTrade.time.getMinutes(),
                                      }
                                    : undefined,
                            // Apply maxTime restrictions if user has selected today's date.
                            maxTime: isSameDay(value, now)
                                ? {
                                      h: now.getHours(),
                                      m: now.getMinutes(),
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Quantity" />
        ),
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);

            useEffect(() => {
                setError(Number(value) === 0);
            }, [value]);

            return (
                <DecimalInput
                    kind="quantity"
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
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: (ctx) => {
            const { state } = useAddPosition();
            const { value, setValue, sync } =
                useDataTableEditableCell<string>(ctx);

            const [error, setError] = useState(false);

            useEffect(() => {
                setError(Number(value) === 0);
            }, [value]);

            return (
                <DecimalInput
                    kind="amount"
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
            const { removeTrade } = useAddPosition();
            // We want to disable this button if we have only 1 trade (rows count = 1).
            const disableButton = table.getRowModel().rows.length === 1;
            return (
                <Tooltip
                    content="There must be a trade"
                    contentProps={{ side: "bottom" }}
                    disabled={!disableButton}
                >
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTrade(row.index)}
                        disabled={disableButton}
                    >
                        <IconTrash className="text-foreground-red" size={20} />
                    </Button>
                </Tooltip>
            );
        },
    },
];

const TradesTable = memo(
    ({
        trades,
        setTrades,
    }: {
        trades: NewTrade[];
        setTrades: React.Dispatch<React.SetStateAction<NewTrade[]>>;
    }) => {
        const updateFn = useMemo(
            () => getDataTableCellUpdateFn<NewTrade>(setTrades),
            []
        );

        const table = useReactTable({
            columns,
            data: trades,
            getCoreRowModel: getCoreRowModel(),
            enableSorting: false,
            meta: {
                updateFn,
            },
        });

        return <DataTable table={table} />;
    }
);

const AddTradeButton = memo(
    ({
        tradesAreValid,
        insertNewTrade,
    }: {
        tradesAreValid: boolean;
        insertNewTrade: () => void;
    }) => {
        return (
            <Tooltip
                content={
                    <div className="flex-center gap-x-2">
                        <IconAlert size={18} />
                        <p>Fill in missing information to proceed</p>
                    </div>
                }
                contentProps={{ side: "bottom" }}
                disabled={tradesAreValid}
            >
                <Button
                    variant="secondary"
                    disabled={!tradesAreValid}
                    onClick={() => insertNewTrade()}
                >
                    <IconPlus /> Add Trade
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
        net_pnl_amount: DecimalString;
        net_return_percentage: number;
        gross_pnl_amount: DecimalString;
        charges_as_percentage_of_net_pnl: number;
        currency: CurrencyCode;
        charges_amount: DecimalString;
    }) => {
        let trendingIcon: ReactNode = null;
        let textColor = "text-foreground";
        const grossPnL = Number(gross_pnl_amount);
        const netPnL = Number(net_pnl_amount);

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

// TODO: Use `WithDebounce` instead.
const SymbolInput = memo(
    ({
        value: valueProp,
        setState,
    }: {
        value: string;
        setState: React.Dispatch<React.SetStateAction<State>>;
    }) => {
        const [value, setValue] = useWrappedState<string>(valueProp);

        return (
            <WithLabel Label={<Label>Symbol</Label>}>
                <Input
                    type="text"
                    autoFocus
                    variant={value ? "default" : "error"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() =>
                        value !== valueProp &&
                        setState((prev) => ({
                            ...prev,
                            symbol: value,
                        }))
                    }
                    aria-invalid={!value}
                    aria-describedby="first-name-error"
                />
            </WithLabel>
        );
    }
);

// TODO: Use `WithDebounce` instead.
const RiskInput = memo(
    ({
        currency,
        value: valueProp,
        setState,
    }: {
        currency: CurrencyCode;
        value: string;
        setState: React.Dispatch<React.SetStateAction<State>>;
    }) => {
        const [value, setValue] = useWrappedState<string>(valueProp);
        return (
            <WithLabel Label={<Label>Risk</Label>}>
                <DecimalInput
                    kind="amount"
                    currency={currency}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}
                    onBlur={(e) => {
                        value !== valueProp &&
                            setState((prev) => ({
                                ...prev,
                                risk_amount: e.target.value,
                            }));
                    }}
                />
            </WithLabel>
        );
    }
);

// TODO: Use `WithDebounce` instead.
const ChargesInput = memo(
    ({
        currency,
        value: valueProp,
        setState,
    }: {
        currency: CurrencyCode;
        value: string;
        setState: React.Dispatch<React.SetStateAction<State>>;
    }) => {
        const [value, setValue] = useWrappedState<DecimalString>(valueProp);
        return (
            <WithLabel Label={<Label>Charges</Label>}>
                <DecimalInput
                    kind="amount"
                    currency={currency}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={(e) =>
                        value !== valueProp &&
                        setState((prev) => ({
                            ...prev,
                            charges_amount: e.target.value,
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
