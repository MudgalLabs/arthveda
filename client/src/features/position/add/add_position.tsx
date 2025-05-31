import { memo, ReactNode, useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
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
import { useAddPosition } from "@/features/position/add/add_position_context";
import { OrderKindToggle } from "@/components/toggle/trade_kind_toggle";
import {
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
import { Card, CardContent, CardTitle } from "@/components/card";
import {
    cn,
    formatCurrency,
    formatDate,
    getElapsedTime,
    isSameDay,
} from "@/lib/utils";
import { CurrencySelect } from "@/components/select/currency_select";
import { DecimalInput } from "@/components/input/decimal_input";
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
import { WithDebounce } from "@/components/with_debounce";
import { SymbolInput } from "@/features/position/components/symbol_input";

function AddPosition() {
    const {
        state,
        setState,
        isComputing,
        canDiscard,
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

            <div className="flex flex-col items-stretch gap-x-6 gap-y-4 sm:flex-row">
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

            <div className="flex flex-col gap-y-4 sm:flex-row sm:justify-between">
                <WithDebounce
                    state={state.symbol}
                    onDebounce={(v) => {
                        setState((prev) => ({
                            ...prev,
                            symbol: v,
                        }));
                    }}
                >
                    {(value, setValue) => (
                        <WithLabel Label={<Label>Symbol</Label>}>
                            <SymbolInput
                                autoFocus
                                variant={value ? "default" : "error"}
                                value={value}
                                onChange={(_, v) => setValue(v)}
                                aria-invalid={!value}
                                aria-describedby="first-name-error"
                            />
                        </WithLabel>
                    )}
                </WithDebounce>

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

                <WithDebounce
                    state={state.risk_amount}
                    onDebounce={(v) => {
                        setState((prev) => ({
                            ...prev,
                            risk_amount: v,
                        }));
                    }}
                >
                    {(value, setValue) => (
                        <WithLabel Label={<Label>Risk</Label>}>
                            <DecimalInput
                                kind="amount"
                                currency={state.currency}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                }}
                            />
                        </WithLabel>
                    )}
                </WithDebounce>

                <WithDebounce
                    state={state.charges_amount}
                    onDebounce={(v) => {
                        setState((prev) => ({
                            ...prev,
                            charges_amount: v,
                        }));
                    }}
                >
                    {(value, setValue) => (
                        <WithLabel Label={<Label>Charges</Label>}>
                            <DecimalInput
                                kind="amount"
                                currency={state.currency}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </WithLabel>
                    )}
                </WithDebounce>
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

            <div className="flex flex-col justify-end gap-x-4 gap-y-2 sm:flex-row">
                <DiscardButton canDiscard={canDiscard} discard={discard} />

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
            const { syncWithValue } = useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);

            useEffect(() => {
                setError(
                    ctx.row.original.quantity === "" ||
                        Number(ctx.row.original.quantity) < 0
                );
            }, [ctx.row.original.quantity]);

            return (
                <WithDebounce
                    state={ctx.row.original.quantity}
                    onDebounce={(v) => syncWithValue(v)}
                >
                    {(value, setValue) => (
                        <DecimalInput
                            kind="quantity"
                            variant={error ? "error" : "default"}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                </WithDebounce>
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
            const { syncWithValue } = useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);

            useEffect(() => {
                setError(
                    ctx.row.original.price === "" ||
                        Number(ctx.row.original.price) < 0
                );
            }, [ctx.row.original.price]);

            return (
                <WithDebounce
                    state={ctx.row.original.price}
                    onDebounce={(v) => syncWithValue(v)}
                >
                    {(value, setValue) => (
                        <DecimalInput
                            kind="amount"
                            currency={state.currency}
                            variant={error ? "error" : "default"}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    )}
                </WithDebounce>
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
                    content="There must at least be one trade"
                    contentProps={{ side: "bottom" }}
                    disabled={!disableButton}
                >
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTrade(row.index)}
                        disabled={disableButton}
                    >
                        <IconTrash className="text-red-foreground" size={20} />
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
                        <p>Fill in the missing information</p>
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
                    <IconPlus />
                    Trade
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
        net_return_percentage: DecimalString;
        gross_pnl_amount: DecimalString;
        charges_as_percentage_of_net_pnl: DecimalString;
        currency: CurrencyCode;
        charges_amount: DecimalString;
    }) => {
        let trendingIcon: ReactNode = null;
        let textColor = "text-foreground";
        const grossPnL = new Decimal(gross_pnl_amount);
        const netPnL = new Decimal(net_pnl_amount);

        if (!netPnL.isZero() && netPnL.isPositive()) {
            trendingIcon = <IconTrendingUp size={20} />;
            textColor = "text-foreground-green";
        } else if (netPnL.isNegative()) {
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
                                "text-foreground-green": grossPnL.isPositive(),
                                "text-foreground-red": grossPnL.isNegative(),
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

        const cardContent = (
            <>
                <div className={`flex items-end gap-x-2 ${textColor}`}>
                    <p className="big-heading leading-none">
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
                                    100 -
                                    new Decimal(
                                        charges_as_percentage_of_net_pnl
                                    ).toNumber()
                                }
                            />
                        </Tooltip>
                    </div>
                )}
            </>
        );

        if (new Decimal(net_return_percentage).isZero() && grossPnL.isZero()) {
            return (
                <Card className="relative min-w-60 flex-col gap-y-2">
                    <CardTitle>PnL</CardTitle>
                    <CardContent className="absolute-center">
                        {cardContent}
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="flex flex-col gap-y-2">
                <CardTitle>PnL</CardTitle>

                <CardContent className="flex h-full flex-col items-start">
                    <div className={`flex items-end gap-x-2 ${textColor}`}>
                        <p className="big-heading leading-none">
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
                                        100 -
                                        new Decimal(
                                            charges_as_percentage_of_net_pnl
                                        ).toNumber()
                                    }
                                />
                            </Tooltip>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }
);

const RFactorCard = memo(({ r_factor }: { r_factor: DecimalString }) => {
    const rFactor = new Decimal(r_factor);
    let textColor = "";

    if (rFactor.isPositive() && !rFactor.isZero())
        textColor = "text-foreground-green";
    if (rFactor.isNegative() && !rFactor.isZero())
        textColor = "text-foreground-red";

    return (
        <Card className="relative min-w-30">
            <CardTitle>R Factor</CardTitle>
            <CardContent className="absolute-center">
                <p className={`big-heading ${textColor}`}>{r_factor}</p>
            </CardContent>
        </Card>
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
            <Card className="flex flex-col gap-y-2">
                <CardTitle>Duration</CardTitle>

                <CardContent className="flex h-full flex-col items-center gap-y-2">
                    <p className="heading">
                        {days} days {hours} hours {minutes} mins
                    </p>

                    <div className="flex items-center gap-x-1 text-sm">
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
                </CardContent>
            </Card>
        );
    }
);

const DiscardButton = memo(
    ({ canDiscard, discard }: { canDiscard: boolean; discard: () => void }) => {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" disabled={!canDiscard}>
                        Discard
                    </Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disacard this position?
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
