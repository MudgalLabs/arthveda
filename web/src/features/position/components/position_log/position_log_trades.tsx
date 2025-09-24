import { memo, useEffect, useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
    Button,
    Checkbox,
    cn,
    DataTable,
    DataTableColumnHeader,
    DatePicker,
    getDataTableCellUpdateFn,
    IconInfo,
    IconPlus,
    IconTrash,
    isSameDay,
    Label,
    Setter,
    Tooltip,
    useDataTableEditableCell,
} from "netra";

import { OrderKindToggle } from "@/components/toggle/trade_kind_toggle";
import { CreateTrade, Trade, TradeKind } from "@/features/trade/trade";
import { usePositionStore } from "@/features/position/position_store_context";
import { WithDebounce } from "@/components/with_debounce";
import { DecimalInput } from "@/components/input/decimal_input";
import { usePositionTradesAreValid } from "@/features/position/position_store";

export function PositionLogTrades() {
    const position = usePositionStore((s) => s.position);
    const setTrades = usePositionStore((s) => s.setTrades);
    const enableAutoCharges = usePositionStore((s) => s.enableAutoCharges);
    const setEnabledAutoCharges = usePositionStore((s) => s.setEnableAutoCharges);
    const tradesAreValid = usePositionTradesAreValid();
    const insertNewTrade = usePositionStore((s) => s.insertNewTrade);

    return (
        <>
            <div className="flex-x">
                <Checkbox
                    id="auto"
                    checked={enableAutoCharges}
                    onCheckedChange={() => setEnabledAutoCharges(!enableAutoCharges)}
                />

                <Label htmlFor="auto">Enable Auto Charges</Label>
                <Tooltip content="Charges will get calculated for each trade approximately to actual charges. Requires a broker account to be selected.">
                    <IconInfo />
                </Tooltip>
            </div>

            <div className="h-4" />

            <TradesTable trades={position.trades || []} setTrades={setTrades} />

            <div className="h-2" />

            <div className="flex w-full justify-end">
                <AddTradeButton tradesAreValid={tradesAreValid} insertNewTrade={insertNewTrade} />
            </div>
        </>
    );
}

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
                <WithDebounce state={ctx.row.original.price} onDebounce={(v) => syncWithValue(v)}>
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
                <WithDebounce state={ctx.row.original.charges_amount} onDebounce={(v) => syncWithValue(v)}>
                    {(value, setValue) => (
                        <Tooltip content="Auto charges is enabled" disabled={!enableAutoCharges}>
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
                    <Button variant="ghost" size="icon" onClick={() => removeTrade(row.index)} disabled={disableButton}>
                        <IconTrash size={18} />
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
                content="Some required fields are missing"
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
