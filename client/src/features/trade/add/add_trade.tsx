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
import { SubTrade, useAddTrade } from "@/features/trade/add/add_trade_context";
import { OrderKindToggle } from "@/components/toggle/order_kind_toggle";
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
import { OrderKind } from "@/features/trade/trade";
import { Card, CardTitle } from "@/components/card";
import { cn, formatDate, getElapsedTime } from "@/lib/utils";

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
                                planned_risk: Number(e.target.value),
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
                                charges: Number(e.target.value),
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
                <Button variant="secondary">Cancel</Button>
                <Button>Save</Button>
            </div>
        </>
    );
}

const columns: ColumnDef<SubTrade>[] = [
    {
        accessorKey: "order_kind",
        header: "Buy / Sell",
        cell: (ctx) => {
            const { value, syncWithValue } =
                useDataTableEditableCell<OrderKind>(ctx);
            return <OrderKindToggle value={value} onChange={syncWithValue} />;
        },
        enableSorting: false,
    },
    {
        accessorKey: "time",
        header: "Time",
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<Date>(ctx);
            return (
                <DatePicker
                    time
                    dates={[value]}
                    onDatesChange={(dates) => setValue(dates[0])}
                    onClose={sync}
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
            return (
                <Input
                    type="number"
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
            return (
                <Input
                    type="number"
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
                    onClick={() => removeSubTrade(row.original.id)}
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
            updateFn: getDataTableCellUpdateFn<SubTrade>(setSubTrades),
        },
    });

    return <DataTable table={table} />;
}

function AddSubTradeButton() {
    const { insertNewSubTrade } = useAddTrade();

    return (
        <Button variant="secondary" onClick={() => insertNewSubTrade()}>
            <IconPlus /> Add Sub Trade
        </Button>
    );
}

function PnLCard() {
    const {
        processTradeResult: {
            net_pnl_amount,
            net_return_percentage,
            gross_pnl_amount,
            cost_as_percentage_of_net_pnl,
        },
        state: { charges_amount },
    } = useAddTrade();

    let netPnLSign = "";
    let trendingIcon: ReactNode = null;
    let textColor = "text-foreground";

    if (net_pnl_amount > 0) {
        netPnLSign = "+";
        trendingIcon = <IconTrendingUp size={20} />;
        textColor = "text-foreground-green";
    } else if (net_pnl_amount < 0) {
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
                            "text-foreground-green": gross_pnl_amount > 0,
                            "text-foreground-red": gross_pnl_amount < 0,
                        })}
                    >
                        {gross_pnl_amount > 0
                            ? "+"
                            : gross_pnl_amount < 0
                              ? "-"
                              : ""}
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
    const [now, setNow] = useState(new Date());

    const {
        processTradeResult: { opened_at, closed_at },
    } = useAddTrade();

    const { days, hours, minutes } = getElapsedTime(
        opened_at,
        closed_at ?? now
    );

    useEffect(() => {
        const id = setInterval(() => {
            setNow(new Date());
            // PERF: Should we increase this interval time because in
            // UI the lowest time period is minutes so updating it every
            // second isn't really that important here.
        }, 1000);

        () => clearInterval(id);
    }, []);

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
