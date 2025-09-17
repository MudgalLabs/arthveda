import { ReactNode, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Decimal from "decimal.js";
import {
    DataTable,
    DataTableColumnHeader,
    DataTablePagination,
    DataTableSmart,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    formatCurrency,
    IconArrowUpRight,
    LoadingScreen,
} from "netra";

import { PositionSearchResponse } from "@/lib/api/position";
import { Position } from "@/features/position/position";
import { PnL } from "@/components/pnl";
import { ROUTES } from "@/constants";
import { Link } from "@/components/link";

interface ListPositionsModalProps {
    renderTrigger: () => ReactNode;
    open: boolean;
    setOpen: (open: boolean) => void;
    isLoading?: boolean;
    data?: PositionSearchResponse;
    title?: string;
    description?: string;
}

export function ListPositionsModal(props: ListPositionsModalProps) {
    const { renderTrigger, data, open, setOpen, isLoading, title = "Positions", description = "Positions" } = props;

    const content = useMemo(() => {
        if (isLoading) return <LoadingScreen />;

        if (!data) return null;

        return (
            <div className="w-full overflow-x-auto">
                <DataTableSmart columns={columns} data={data.items} total={data.pagination.total_items}>
                    {(table) => (
                        <div className="space-y-4">
                            <DataTable table={table} />
                            {data.pagination.total_items > data.pagination.limit && (
                                <DataTablePagination table={table} total={data.pagination.total_items} />
                            )}
                        </div>
                    )}
                </DataTableSmart>
            </div>
        );
    }, [data, isLoading]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>

            <DialogContent className="max-w-xl!">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {content}
            </DialogContent>
        </Dialog>
    );
}

const columns: ColumnDef<Position>[] = [
    {
        id: "symbol",
        meta: {
            columnVisibilityHeader: "Symbol",
        },
        accessorKey: "symbol",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Symbol" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <Link to={ROUTES.viewPosition(row.original.id)} target="_blank">
                <span className="flex-x">
                    {row.original.symbol} <IconArrowUpRight />
                </span>
            </Link>
        ),
    },
    {
        id: "net_return_percentage",
        accessorKey: "net_return_percentage",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="ROI" disabled={table.options.meta?.isFetching} column={column} />
        ),
        cell: ({ row }) => {
            const value = Number(row.original.net_return_percentage);
            return <PnL value={new Decimal(value)}>{value.toFixed(2)}%</PnL>;
        },
    },
    {
        id: "gross_pnl",
        accessorKey: "gross_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Gross" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.gross_pnl_amount)}>
                {formatCurrency(row.original.gross_pnl_amount, {
                    currency: row.original.currency,
                })}
            </PnL>
        ),
    },
    {
        id: "net_pnl",
        accessorKey: "net_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Net" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <PnL value={new Decimal(row.original.net_pnl_amount)}>
                {formatCurrency(row.original.net_pnl_amount, {
                    currency: row.original.currency,
                })}
            </PnL>
        ),
    },
];
