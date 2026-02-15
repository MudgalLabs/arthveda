import { ReactNode, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";
import {
    DataTable,
    DataTableColumnHeader,
    DataTableSmart,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    formatCurrency,
    formatDate,
    LoadingScreen,
} from "netra";

import { PnL } from "@/components/pnl";
import { ROUTES } from "@/constants";
import { Link } from "@/components/link";
import { GetCalendarDayResponse } from "@/lib/api/calendar";
import { Trade } from "@/features/trade/trade";

interface CalendarDayInfoModalProps {
    renderTrigger: () => ReactNode;
    open: boolean;
    setOpen: (open: boolean) => void;
    date: Date;
    isLoading?: boolean;
    data?: GetCalendarDayResponse;
}

export function CalendarDayInfoModal(props: CalendarDayInfoModalProps) {
    const { renderTrigger, data, open, setOpen, date, isLoading } = props;

    const content = useMemo(() => {
        if (isLoading) return <LoadingScreen />;

        if (!data) return null;

        const grossRFactor = new Decimal(data.gross_r_factor);
        const netRFactor = new Decimal(data.net_r_factor);

        return (
            <div>
                <div className="mt-0 inline-flex w-[80%] gap-x-8">
                    <div>
                        <p>Gross</p>
                        <PnL className="text-lg font-medium" value={new Decimal(data.gross_pnl)}>
                            {formatCurrency(data.gross_pnl)}
                        </PnL>
                    </div>
                    <div>
                        <p>Gross R</p>
                        <PnL className="text-lg font-medium" value={grossRFactor}>
                            {grossRFactor.toFixed(2)}
                        </PnL>
                    </div>
                    <div>
                        <p>Charges</p>
                        <PnL className="text-lg font-medium" variant="negative" value={new Decimal(data.charges)}>
                            {formatCurrency(data.charges)}
                        </PnL>
                    </div>
                    <div>
                        <p>Net</p>
                        <PnL className="text-lg font-medium" value={new Decimal(data.net_pnl)}>
                            {formatCurrency(data.net_pnl)}
                        </PnL>
                    </div>
                    <div>
                        <p>Net R</p>
                        <PnL className="text-lg font-medium" value={netRFactor}>
                            {netRFactor.toFixed(2)}
                        </PnL>
                    </div>
                </div>

                <ul className="mt-8 w-full space-y-8 overflow-x-auto">
                    {data.positions.map((position, idx) => (
                        <li key={position.id}>
                            <h3 className="flex-x mb-2 text-base font-medium">
                                {idx + 1}.
                                <Link
                                    to={ROUTES.viewPosition(position.id)}
                                    className="flex-x inline-block w-fit gap-x-1 text-base!"
                                >
                                    {position.symbol}
                                </Link>
                            </h3>

                            <DataTableSmart
                                columns={columns}
                                data={position.trades!}
                                total={position.trades!.length}
                                extra={{ isFetching: false }}
                            >
                                {(table) => (
                                    <div className="space-y-4">
                                        <DataTable table={table} />
                                    </div>
                                )}
                            </DataTableSmart>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }, [data, isLoading]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>

            <DialogContent className="max-h-[95vh]! max-w-[95vw]! overflow-scroll lg:max-h-[80vh]! lg:max-w-3xl!">
                <DialogHeader>
                    <DialogTitle>{formatDate(date)}</DialogTitle>
                    <DialogDescription hidden>
                        Summary of positions and their trades that realised PnL on this day
                    </DialogDescription>
                </DialogHeader>

                {content}
            </DialogContent>
        </Dialog>
    );
}

const columns: ColumnDef<Trade>[] = [
    {
        id: "time",
        meta: {
            columnVisibilityHeader: "Executed at",
        },
        accessorKey: "time",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Executed at" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => <span>{formatDate(new Date(row.original.time), { time: true })}</span>,
    },
    {
        id: "realised_gross_pnl",
        accessorKey: "realised_gross_pnl",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Gross" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <PnL className="flex-x gap-x-4" value={new Decimal(row.original.realised_gross_pnl || 0)}>
                {formatCurrency(row.original.realised_gross_pnl || 0)}
                <span>{Number(row.original.gross_r_factor).toFixed(2)}R</span>
            </PnL>
        ),
    },
    {
        id: "charges_amount",
        accessorKey: "charges_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Charges" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.charges_amount || 0)} variant="negative">
                {formatCurrency(row.original.charges_amount || 0)}
            </PnL>
        ),
    },
    {
        id: "realised_net_pnl",
        accessorKey: "realised_net_pnl",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Net" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <PnL className="flex-x gap-x-4" value={new Decimal(row.original.realised_net_pnl || 0)}>
                <span>{formatCurrency(row.original.realised_net_pnl || 0)} </span>
                <span>{Number(row.original.r_factor).toFixed(2)}R</span>
            </PnL>
        ),
    },
];
