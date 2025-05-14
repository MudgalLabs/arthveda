import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { SegmentToggle } from "@/components/toggle/segment_toggle";
import { WithLabel } from "@/components/with_label";
import { SubTrade, useAddTrade } from "@/features/trade/add/add_trade_context";
import {
    BuyOrSellState,
    BuyOrSellToggle,
} from "@/components/toggle/buy_or_sell_toggle";
import { IconPlus, IconTrash } from "@/components/icons";

import { Button, DataTable, DatePicker, Input, Label, Separator } from "@/s8ly";
import {
    getDataTableCellUpdateFn,
    useDataTableEditableCell,
} from "@/hooks/use_data_table_editable_cell";

function AddTrade() {
    return (
        <>
            <h1 className="heading">Add Trade</h1>

            <div className="h-3" />
            <Separator />
            <div className="h-6" />

            <div className="flex items-center justify-between">
                <WithLabel Label={<Label>Symbol</Label>}>
                    <Input type="text" />
                </WithLabel>

                <WithLabel Label={<Label>Instrument</Label>}>
                    <SegmentToggle />
                </WithLabel>

                <WithLabel Label={<Label>Planned Risk</Label>}>
                    <Input type="number" />
                </WithLabel>

                <WithLabel Label={<Label>Charges</Label>}>
                    <Input type="number" />
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
        accessorKey: "buy_or_sell",
        header: "Buy / Sell",
        cell: (ctx) => {
            const { value, syncWithValue } =
                useDataTableEditableCell<BuyOrSellState>(ctx);
            return <BuyOrSellToggle value={value} onChange={syncWithValue} />;
        },
        enableSorting: false,
    },
    {
        accessorKey: "time",
        header: "Time",
        cell: (ctx) => {
            const { value, setValue, sync } =
                useDataTableEditableCell<Date[]>(ctx);
            return (
                <DatePicker
                    time
                    dates={value}
                    onDatesChange={setValue}
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
                <Button variant="destructive" size="icon">
                    <IconTrash
                        className="text-foreground"
                        size={20}
                        onClick={() => removeSubTrade(row.original.id)}
                    />
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

export default AddTrade;
