import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Decimal from "decimal.js";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import {
    Button,
    DataTable,
    DatePicker,
    Dialog,
    DialogFooter,
    DialogHeader,
    Label,
    Tooltip,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    Checkbox,
    Textarea,
} from "@/s8ly";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { WithLabel } from "@/components/with_label";
import { OrderKindToggle } from "@/components/toggle/trade_kind_toggle";
import { IconCalendarRange, IconCross, IconInfo, IconPlus } from "@/components/icons";
import { getDataTableCellUpdateFn, useDataTableEditableCell } from "@/hooks/use_data_table_editable_cell";
import { Card, CardContent, CardTitle } from "@/components/card";
import { cn, formatDate, getElapsedTime, isSameDay } from "@/lib/utils";
import { DecimalInput } from "@/components/input/decimal_input";
import { CreateTrade, Trade, TradeKind } from "@/features/trade/trade";
import { apiHooks } from "@/hooks/api_hooks";
import { toast } from "@/components/toast";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { PageHeading } from "@/components/page_heading";
import { apiErrorHandler } from "@/lib/api";
import { DecimalString, Setter } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { WithDebounce } from "@/components/with_debounce";
import { SymbolInput } from "@/features/position/components/symbol_input";
import { usePositionStore } from "../position_store_context";
import { ComputePositionResponse } from "@/lib/api/position";
import { LoadingScreen } from "@/components/loading_screen";
import {
    usePositionCanBeSaved,
    useHasPositionDataChanged,
    usePositionCanBeComputed,
    usePositionTradesAreValid,
    useIsCreatingPosition,
    useIsEditingPosition,
} from "@/features/position/position_store";
import { OverviewCard } from "@/features/dashboard/widget/overview_card";
import { ROUTES } from "@/routes_constants";
import { BrokerSelect } from "@/components/select/broker_select";

function AddPosition() {
    const isCreatingPosition = useIsCreatingPosition();
    const isEditingPosition = useIsEditingPosition();

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutateAsync: create, isPending: isCreating } = apiHooks.position.useCreate({
        onSuccess: async (res) => {
            const positionID = res.data.data.position.id;
            toast.success("Position Created", {
                action: {
                    label: "View",
                    onClick: () => {
                        navigate(ROUTES.viewPosition(positionID));
                    },
                },
            });

            discard();
            queryClient.invalidateQueries({
                queryKey: ["useGetDashboard"],
            });
            queryClient.invalidateQueries({
                queryKey: ["usePositionsSearch"],
            });
        },
        onError: apiErrorHandler,
    });

    const { mutateAsync: update, isPending: isUpdating } = apiHooks.position.useUpdate({
        onSuccess: async () => {
            toast.success("Position Updated");
            queryClient.invalidateQueries({
                queryKey: ["useGetDashboard"],
            });
            queryClient.invalidateQueries({
                queryKey: ["usePositionsSearch"],
            });
        },
        onError: apiErrorHandler,
    });

    const { mutateAsync: deletePosition, isPending: isDeleting } = apiHooks.position.useDelete({
        onSuccess: async () => {
            toast.success("Position Deleted");
            queryClient.invalidateQueries({
                queryKey: ["useGetDashboard"],
            });
            queryClient.invalidateQueries({
                queryKey: ["usePositionsSearch"],
            });
            navigate(ROUTES.positionList);
        },
        onError: apiErrorHandler,
    });

    const [skipCompute, setSkipCompute] = useState(false);
    const setTrades = usePositionStore((s) => s.setTrades);

    const { mutateAsync: compute, isPending: isComputing } = apiHooks.position.useCompute({
        onSuccess: async (res) => {
            const data = res.data.data as ComputePositionResponse;

            const charges = data.trade_charges || [];

            if (charges.length === position.trades?.length) {
                setTrades((trades) =>
                    trades.map((trade, index) => ({
                        ...trade,
                        charges_amount: charges[index] || "0",
                    }))
                );
                // We are doing this because, updating the trades will trigger the compute again.
                // In the compute call in the useEffect, we should check for this flag, skip the compute
                // and set this to `false` again.
                setSkipCompute(true);
            }

            updatePosition({
                ...data,
                opened_at: new Date(data.opened_at),
                closed_at: data.closed_at ? new Date(data.closed_at) : null,
            });
        },
        onSettled: () => {
            if (!isInitialized) {
                setIsInitialized(true);
            }
        },
        onError: apiErrorHandler,
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const position = usePositionStore((s) => s.position);
    const insertNewTrade = usePositionStore((s) => s.insertNewTrade);
    const discard = usePositionStore((s) => s.discard);
    const updatePosition = usePositionStore((s) => s.updatePosition);
    const [shouldCompute, setShouldCompute] = usePositionCanBeComputed();
    const canSave = usePositionCanBeSaved();
    const tradesAreValid = usePositionTradesAreValid();
    const hasPositionDataChanged = useHasPositionDataChanged();

    const handleClickSave = () => {
        if (!canSave) return;

        const dataForCreate = {
            risk_amount: position.risk_amount || "0",
            symbol: position.symbol,
            instrument: position.instrument,
            currency: position.currency,
            notes: position.notes,
            trades: (position.trades || []).map((t) => {
                // Removing fields that are not required by the API.
                // We are removing these fields because the API will throw an error if we send them.
                return {
                    kind: t.kind,
                    time: t.time,
                    quantity: t.quantity || "0",
                    price: t.price || "0",
                    charges_amount: t.charges_amount || "0",
                };
            }),
        };

        const dataForUpdate = {
            ...dataForCreate,
            broker_id: position.broker_id,
        };

        if (isCreatingPosition) {
            create(dataForCreate);
        } else if (isEditingPosition) {
            update({ id: position.id, body: dataForUpdate });
        }
    };

    const enableAutoCharges = usePositionStore((s) => s.enableAutoCharges);
    const setEnabledAutoCharges = usePositionStore((s) => s.setEnableAutoCharges);

    // FIXME: For some reason, the compute is being called twice on mount.
    useEffect(() => {
        if (skipCompute) {
            setSkipCompute(false);
            return;
        }

        if (!isInitialized || shouldCompute) {
            setShouldCompute(false);

            compute({
                trades: (position.trades || []).map((t) => {
                    const trade: CreateTrade = {
                        kind: t.kind,
                        time: t.time,
                        quantity: t.quantity || "0",
                        price: t.price || "0",
                        charges_amount: t.charges_amount || "0",
                    };

                    return trade;
                }),
                risk_amount: position.risk_amount || "0",
                instrument: position.instrument,
                enable_auto_charges: enableAutoCharges,
                broker_id: position.broker_id,
            });
        }
    }, [compute, isInitialized, shouldCompute, skipCompute, position, enableAutoCharges, setShouldCompute]);

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    return (
        <>
            <PageHeading heading="Add Position" loading={isComputing} />

            <div className="flex flex-col items-stretch gap-x-6 gap-y-4 sm:h-44 sm:flex-row">
                <OverviewCard
                    className="w-full sm:w-fit"
                    total_charges_amount={position.total_charges_amount}
                    charges_as_percentage_of_net_pnl={position.charges_as_percentage_of_net_pnl}
                    currency={position.currency}
                    gross_pnl_amount={position.gross_pnl_amount}
                    net_pnl_amount={position.net_pnl_amount}
                    net_return_percentage={position.net_return_percentage}
                />

                <RFactorCard r_factor={position.r_factor} />

                <DurationCard opened_at={position.opened_at} closed_at={position.closed_at} />

                <div className="flex items-end">
                    <div className="flex h-fit gap-x-2">
                        <DirectionTag direction={position.direction} />
                        <StatusTag
                            currency={position.currency}
                            status={position.status}
                            openAvgPrice={position.open_average_price_amount}
                            openQuantity={position.open_quantity}
                        />
                    </div>
                </div>
            </div>

            <div className="h-8" />

            <div className="flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:justify-between">
                <WithDebounce
                    state={position.symbol}
                    onDebounce={(v) => {
                        updatePosition({
                            symbol: v,
                        });
                    }}
                >
                    {(value, setValue) => (
                        <WithLabel Label={<Label>Symbol</Label>}>
                            <SymbolInput
                                variant={value ? "default" : "error"}
                                value={value}
                                onChange={(_, v) => setValue(v)}
                                aria-invalid={!value}
                                aria-describedby="first-name-error"
                                errorMsg="Symbol is required"
                            />
                        </WithLabel>
                    )}
                </WithDebounce>

                <WithLabel Label={<Label>Instrument</Label>}>
                    <InstrumentToggle
                        value={position.instrument}
                        onChange={(value) =>
                            value &&
                            updatePosition({
                                instrument: value,
                            })
                        }
                    />
                </WithLabel>

                <WithDebounce
                    state={position.risk_amount}
                    onDebounce={(v) => {
                        updatePosition({
                            risk_amount: v,
                        });
                    }}
                >
                    {(value, setValue) => (
                        <WithLabel Label={<Label>Risk</Label>}>
                            <DecimalInput
                                kind="amount"
                                currency={position.currency}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                }}
                            />
                        </WithLabel>
                    )}
                </WithDebounce>

                <WithLabel
                    Label={
                        <Label className="flex items-center gap-x-2">
                            <Checkbox
                                id="auto"
                                checked={enableAutoCharges}
                                onCheckedChange={() => setEnabledAutoCharges(!enableAutoCharges)}
                            />
                            <Label htmlFor="auto">Enable Auto Charges</Label>
                            <Tooltip content="Charges are calculated based on the trade and closely match actual charges">
                                <IconInfo />
                            </Tooltip>
                        </Label>
                    }
                >
                    <BrokerSelect
                        value={position.broker_id || ""}
                        onValueChange={(v) =>
                            updatePosition({
                                broker_id: v,
                            })
                        }
                        disabled={!enableAutoCharges}
                        error={!position.broker_id && enableAutoCharges}
                        errorMsg="Broker is required"
                    />
                </WithLabel>
            </div>

            <div className="h-4" />

            <WithDebounce
                state={position.notes}
                onDebounce={(v) => {
                    updatePosition({
                        notes: v,
                    });
                }}
            >
                {(value, setValue) => (
                    <WithLabel
                        Label={
                            <Label className="flex w-full justify-between">
                                <span>Notes </span> <span className="text-xs">{value.length} / 4096</span>
                            </Label>
                        }
                    >
                        <Textarea
                            className="w-full whitespace-pre-wrap"
                            maxLength={4096}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </WithLabel>
                )}
            </WithDebounce>

            <div className="h-8" />

            <h2 className="sub-heading">Trades</h2>

            <div className="h-4" />

            <TradesTable trades={position.trades || []} setTrades={setTrades} />

            <div className="h-2" />

            <div className="flex w-full justify-end">
                <AddTradeButton tradesAreValid={tradesAreValid} insertNewTrade={insertNewTrade} />
            </div>

            <div className="h-10" />

            <div className="flex flex-col justify-between gap-x-12 gap-y-4 sm:flex-row">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    {isEditingPosition && (
                        <DeleteButton deletePosition={() => deletePosition(position.id)} isDeleting={isDeleting} />
                    )}
                </div>

                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <DiscardButton hasSomethingToDiscard={hasPositionDataChanged} discard={discard} />

                    <Button
                        onClick={handleClickSave}
                        loading={isCreating || isUpdating}
                        disabled={(isEditingPosition && !hasPositionDataChanged) || !canSave}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </>
    );
}

export default AddPosition;

const columns: ColumnDef<CreateTrade>[] = [
    {
        accessorKey: "kind",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Buy / Sell" />,
        cell: (ctx) => {
            const { value, syncWithValue } = useDataTableEditableCell<TradeKind>(ctx);
            return <OrderKindToggle value={value} onChange={(v) => v && syncWithValue(v)} />;
        },
    },
    {
        accessorKey: "time",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
        cell: (ctx) => {
            const { value, setValue, sync } = useDataTableEditableCell<Date>(ctx);
            const trades = usePositionStore((s) => s.position.trades || []);

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
                            minDate: applyDateTimeRestrictions ? secondLastTrade.time : undefined,
                            maxDate: now,
                        },
                        time: {
                            minTime:
                                // We wanna apply time restrictions only if we are on different trade
                                // and the date is not same as previous trade.
                                applyDateTimeRestrictions && isSameDay(value, secondLastTrade.time)
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
        cell: (ctx) => {
            const { syncWithValue } = useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);
            const [errorMsg, setErrorMsg] = useState("");

            useEffect(() => {
                setError(ctx.row.original.quantity === "" || Number(ctx.row.original.quantity) < 0);
                if (ctx.row.original.quantity === "") {
                    setErrorMsg("Quantity is required");
                } else if (Number(ctx.row.original.quantity) < 0) {
                    setErrorMsg("Quantity must be >= 0");
                } else {
                    setErrorMsg("");
                }
            }, [ctx.row.original.quantity]);

            return (
                <WithDebounce state={ctx.row.original.quantity} onDebounce={(v) => syncWithValue(v)}>
                    {(value, setValue) => (
                        <DecimalInput
                            className={cn({
                                "mb-2": error, // The table row mushes the input with the error message, so we add some margin to the bottom.
                            })}
                            kind="quantity"
                            variant={error ? "error" : "default"}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            errorMsg={errorMsg}
                        />
                    )}
                </WithDebounce>
            );
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        cell: (ctx) => {
            const state = usePositionStore((s) => s.position);
            const { syncWithValue } = useDataTableEditableCell<string>(ctx);
            const [error, setError] = useState(false);
            const [errorMsg, setErrorMsg] = useState("");

            useEffect(() => {
                setError(ctx.row.original.price === "" || Number(ctx.row.original.price) < 0);
                if (ctx.row.original.price === "") {
                    setErrorMsg("Price is required");
                } else if (Number(ctx.row.original.price) < 0) {
                    setErrorMsg("Price must be >= 0");
                } else {
                    setErrorMsg("");
                }
            }, [ctx.row.original.price]);

            return (
                <WithDebounce debounceMs={500} state={ctx.row.original.price} onDebounce={(v) => syncWithValue(v)}>
                    {(value, setValue) => (
                        <DecimalInput
                            className={cn({
                                "mb-2": error, // The table row mushes the input with the error message, so we add some margin to the bottom.
                            })}
                            kind="amount"
                            currency={state.currency}
                            variant={error ? "error" : "default"}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            errorMsg={errorMsg}
                        />
                    )}
                </WithDebounce>
            );
        },
    },
    {
        accessorKey: "charges_amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Charges" />,
        cell: (ctx) => {
            const state = usePositionStore((s) => s.position);
            const { syncWithValue } = useDataTableEditableCell<string>(ctx);
            const enableAutoCharges = usePositionStore((s) => s.enableAutoCharges);

            return (
                <WithDebounce
                    debounceMs={500}
                    state={ctx.row.original.charges_amount}
                    onDebounce={(v) => syncWithValue(v)}
                >
                    {(value, setValue) => (
                        <Tooltip content="Charges are being automatically calculated" disabled={!enableAutoCharges}>
                            <DecimalInput
                                kind="amount"
                                currency={state.currency}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                disabled={enableAutoCharges}
                            />
                        </Tooltip>
                    )}
                </WithDebounce>
            );
        },
    },
    {
        id: "delete",
        header: "",
        cell: ({ row, table }) => {
            const removeTrade = usePositionStore((s) => s.removeTrade);
            // We want to disable this button if we have only 1 trade (rows count = 1).
            const disableButton = table.getRowModel().rows.length === 1;
            return (
                <Tooltip
                    content="There must at least be one trade"
                    contentProps={{ side: "bottom" }}
                    disabled={!disableButton}
                >
                    <Button
                        className="text-foreground-muted hover:text-foreground-red!"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTrade(row.index)}
                        disabled={disableButton}
                    >
                        <IconCross size={18} />
                    </Button>
                </Tooltip>
            );
        },
    },
];

const TradesTable = memo(({ trades, setTrades }: { trades: Trade[]; setTrades: Setter<Trade[]> }) => {
    const updateFn = useMemo(() => getDataTableCellUpdateFn<Trade>(setTrades), []);

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
});

const AddTradeButton = memo(
    ({ tradesAreValid, insertNewTrade }: { tradesAreValid: boolean; insertNewTrade: () => void }) => {
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
                <Button variant="secondary" disabled={!tradesAreValid} onClick={() => insertNewTrade()}>
                    <IconPlus />
                    Trade
                </Button>
            </Tooltip>
        );
    }
);

const RFactorCard = memo(({ r_factor }: { r_factor: DecimalString }) => {
    const rFactor = new Decimal(r_factor);
    let textColor = "";

    if (rFactor.isPositive() && !rFactor.isZero()) textColor = "text-foreground-green";
    if (rFactor.isNegative() && !rFactor.isZero()) textColor = "text-foreground-red";

    return (
        <Card className="relative min-w-30">
            <CardTitle>R Factor</CardTitle>
            <CardContent className="absolute-center">
                <p className={`big-heading ${textColor}`}>{r_factor}</p>
            </CardContent>
        </Card>
    );
});

const DurationCard = memo(({ opened_at, closed_at }: { opened_at: Date; closed_at: Date | null }) => {
    const now = new Date();

    const { days, hours, minutes } = getElapsedTime(opened_at, closed_at ?? now);

    return (
        <Card className="realtive flex min-w-fit flex-col gap-y-2">
            <CardTitle>Duration</CardTitle>

            <CardContent className="flex-center flex h-full flex-col gap-y-2">
                <p className="heading">
                    {days} days {hours} hours {minutes} mins
                </p>

                <div className="flex items-center gap-x-1 text-sm">
                    <IconCalendarRange />
                    <div className="space-x-2">
                        <span>{formatDate(opened_at, { time: true })}</span>
                        {closed_at && <span>- {formatDate(closed_at, { time: true })}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

const DiscardButton = memo(
    ({ hasSomethingToDiscard, discard }: { hasSomethingToDiscard: boolean; discard: () => void }) => {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" disabled={!hasSomethingToDiscard}>
                        Discard
                    </Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard</DialogTitle>
                        <DialogDescription>Are you sure you want to disacard this position?</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="destructive" onClick={() => discard()}>
                                Discard
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

const DeleteButton = memo(
    ({ deletePosition, isDeleting }: { deletePosition: () => Promise<void>; isDeleting?: boolean }) => {
        const [open, setOpen] = useState(false);

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this position?</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                                await deletePosition();
                                setOpen(false);
                            }}
                            loading={isDeleting}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);
