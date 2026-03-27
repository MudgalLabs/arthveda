import { FC, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Loading } from "@/components/loading";
import { Position, positionInstrumentToString } from "@/features/position/position";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTablePagination } from "@/s8ly/data_table/data_table_pagination";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableVisibility } from "@/s8ly/data_table/data_table_visibility";
import { PositionListFilters } from "@/features/position/components/position_list_filters";
import { Tag, Button, Tooltip, getElapsedTime } from "netra";
import { IconArrowUpRight, IconCross } from "@/components/icons";
import {
    defaultPositionSearchFilters,
    positionSearchFiltersLabel,
    positionSearchFiltersValueFormatter,
} from "@/features/position/utils";
import { DataTableState } from "@/s8ly/data_table/data_table_state";
import { useListPositionsStore } from "@/features/position/list_positions_store";
import Decimal from "decimal.js";
import { BrokerLogo } from "@/components/broker_logo";
import { ROUTES } from "@/constants";
import { PnL } from "@/components/pnl";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { WidgetPnLCard } from "@/features/dashboard/widget/widget_pnl_card";
import { GeneralStats } from "@/features/position/position";
import { WidgetWinRate } from "@/features/dashboard/widget/widget_win_rate";
import { WidgetProfitFactor } from "@/features/dashboard/widget/widget_profit_factor";
import { WidgetAvgWinLoss } from "@/features/dashboard/widget/widget_avg_win_loss";
import { PositionExportButton } from "./position_export_button";
import { useBroker } from "@/features/broker/broker_context";
import { Label } from "@/s8ly";

export interface PositionListTable {
    positions: Position[];
    generalStats: GeneralStats;
    hideFilters?: boolean;
    hideColumnVisibility?: boolean;
    totalItems?: number;
    state?: Partial<DataTableState>;
    onStateChange?: (newState: DataTableState) => void;
    isError?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
}

export const PositionListTable: FC<PositionListTable> = memo(
    ({
        positions,
        generalStats,
        hideFilters = false,
        hideColumnVisibility = false,
        totalItems,
        state,
        onStateChange,
        isError,
        isFetching,
        isLoading,
    }) => {
        const homeCurrency = useHomeCurrency();
        const appliedFilters = useListPositionsStore((s) => s.appliedFilters);
        const resetFilter = useListPositionsStore((s) => s.resetFilter);

        const activeFilters = Object.entries(appliedFilters).filter(
            ([key, value]) =>
                value !== defaultPositionSearchFilters[key as keyof typeof defaultPositionSearchFilters] &&
                !key.includes("operator") // Don't show operator as a filter
        );

        const rightAlignedColumns = [
            "r_factor",
            "gross_r_factor",
            "gross_pnl",
            "net_pnl",
            "total_charges_amount",
            "charges_percentage",
            "net_return_percentage",
            "duration",
        ];

        const columns: ColumnDef<Position>[] = useMemo(
            () => [
                {
                    id: "actions",
                    cell: ({ row }) => {
                        const { getBrokerById } = useBroker();
                        const brokerId = row.original.user_broker_account?.broker_id;
                        const broker = brokerId ? getBrokerById(brokerId) : null;

                        return (
                            <div className="flex-x">
                                <Link to={ROUTES.viewPosition(row.original.id)}>
                                    <Tooltip content="View Position" delayDuration={300}>
                                        <Button variant="ghost" size="icon">
                                            <IconArrowUpRight size={18} />
                                        </Button>
                                    </Tooltip>
                                </Link>

                                {row.original.user_broker_account?.broker_id && (
                                    <Tooltip
                                        delayDuration={300}
                                        content={
                                            brokerId ? (
                                                <div className="flex-y min-w-32">
                                                    <div className="flex-x justify-between">
                                                        <Label>Name</Label>
                                                        <span>{row.original.user_broker_account.name}</span>
                                                    </div>

                                                    <div className="flex-x justify-between">
                                                        <Label>Broker</Label>
                                                        <span>{broker?.name}</span>
                                                    </div>
                                                </div>
                                            ) : null
                                        }
                                        disabled={!row.original.user_broker_account?.broker_id}
                                    >
                                        {row.original.user_broker_account?.broker_id && (
                                            <Link to={ROUTES.brokerAccounts}>
                                                <Button variant="ghost" size="icon">
                                                    <BrokerLogo brokerId={row.original.user_broker_account.broker_id} />
                                                </Button>
                                            </Link>
                                        )}
                                    </Tooltip>
                                )}
                            </div>
                        );
                    },
                    enableHiding: false,
                    enableSorting: false,
                },
                {
                    id: "opened",
                    meta: {
                        columnVisibilityHeader: "Opened At",
                    },
                    accessorKey: "opened_at",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Opened At"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <span className="tabular-nums">
                            {formatDate(new Date(row.original.opened_at), { time: true })}
                        </span>
                    ),
                },
                {
                    id: "duration",
                    meta: {
                        columnVisibilityHeader: "Duration",
                    },
                    accessorKey: "closed_at",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Duration"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => {
                        const openedAt = new Date(row.original.opened_at);
                        const closedAt = row.original.closed_at ? new Date(row.original.closed_at) : new Date();

                        const { days, hours, minutes } = getElapsedTime(openedAt, closedAt);

                        return (
                            <p className="">
                                {days > 0 && <span>{days} days</span>} {hours > 0 && <span>{hours} hours</span>}{" "}
                                {<span>{minutes} mins</span>}
                            </p>
                        );
                    },
                    enableSorting: false,
                },
                {
                    id: "symbol",
                    meta: {
                        columnVisibilityHeader: "Symbol",
                    },
                    accessorKey: "symbol",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Symbol"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                },
                {
                    id: "direction",
                    meta: {
                        columnVisibilityHeader: "Direction",
                    },
                    accessorKey: "direction",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Direction"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => <DirectionTag className="w-16" direction={row.original.direction} />,
                },
                {
                    id: "status",
                    meta: {
                        columnVisibilityHeader: "Status",
                    },
                    accessorKey: "status",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Status"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <StatusTag
                            // className="w-12!"
                            status={row.original.status}
                            currency={row.original.currency_code}
                            openQuantity={row.original.open_quantity}
                            openAvgPrice={row.original.open_average_price_amount}
                        />
                    ),
                    // cell: ({ row }) => positionStatusToString(row.original.status),
                },
                {
                    id: "instrument",
                    meta: {
                        columnVisibilityHeader: "Instrument",
                    },
                    accessorKey: "instrument",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Instrument"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => positionInstrumentToString(row.original.instrument),
                },
                {
                    id: "r_factor",
                    meta: {
                        columnVisibilityHeader: "Net R",
                    },
                    accessorKey: "r_factor",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Net R"
                            align="right"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <span>
                            {formatCurrency(new Decimal(row.original.r_factor).toFixed(2), { hideSymbol: true })}
                        </span>
                    ),
                },
                {
                    id: "gross_r_factor",
                    meta: {
                        columnVisibilityHeader: "Gross R",
                    },
                    accessorKey: "gross_r_factor",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Gross R"
                            align="right"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <PnL value={new Decimal(row.original.gross_r_factor)}>
                            {formatCurrency(new Decimal(row.original.gross_r_factor).toFixed(2), { hideSymbol: true })}
                        </PnL>
                    ),
                    enableSorting: false,
                },
                {
                    id: "gross_pnl",
                    meta: {
                        columnVisibilityHeader: "Gross PnL",
                    },
                    accessorKey: "gross_pnl_amount",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Gross PnL"
                            align="right"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <span>
                            {formatCurrency(row.original.gross_pnl_amount, {
                                currency: homeCurrency,
                            })}
                        </span>
                    ),
                },
                {
                    id: "net_pnl",
                    meta: {
                        columnVisibilityHeader: "Net PnL",
                    },
                    accessorKey: "net_pnl_amount",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Net PnL"
                            align="right"
                            column={column}
                            disabled={table.options.meta?.isFetching}
                        />
                    ),
                    cell: ({ row }) => (
                        <PnL value={new Decimal(row.original.net_pnl_amount)}>
                            {formatCurrency(row.original.net_pnl_amount, {
                                currency: homeCurrency,
                            })}
                        </PnL>
                    ),
                },
                {
                    id: "total_charges_amount",
                    meta: {
                        columnVisibilityHeader: "Charges",
                    },
                    accessorKey: "total_charges_amount",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Charges"
                            align="right"
                            disabled={table.options.meta?.isFetching}
                            column={column}
                        />
                    ),
                    cell: ({ row }) => (
                        <span>
                            {formatCurrency(new Decimal(row.original.total_charges_amount).mul(-1).toFixed(2), {
                                currency: homeCurrency,
                            })}
                        </span>
                    ),
                },
                {
                    id: "charges_percentage",
                    meta: {
                        columnVisibilityHeader: "Charges %",
                    },
                    accessorKey: "charges_as_percentage_of_net_pnl",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Charges %"
                            align="right"
                            disabled={table.options.meta?.isFetching}
                            column={column}
                        />
                    ),
                    cell: ({ row }) => <span>{Number(row.original.charges_as_percentage_of_net_pnl).toFixed(2)}%</span>,
                },
                {
                    id: "net_return_percentage",
                    meta: {
                        columnVisibilityHeader: "Net Return %",
                    },
                    accessorKey: "net_return_percentage",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader
                            title="Net Return %"
                            align="right"
                            disabled={table.options.meta?.isFetching}
                            column={column}
                        />
                    ),
                    cell: ({ row }) => (
                        <PnL value={new Decimal(row.original.net_return_percentage)}>
                            {formatCurrency(new Decimal(row.original.net_return_percentage).toFixed(2), {
                                hideSymbol: true,
                            })}
                            %
                        </PnL>
                    ),
                },
                {
                    id: "tags",
                    meta: {
                        columnVisibilityHeader: "Tags",
                    },
                    accessorKey: "tags",
                    header: ({ column, table }) => (
                        <DataTableColumnHeader title="Tags" disabled={table.options.meta?.isFetching} column={column} />
                    ),
                    cell: ({ row }) => (
                        <div className="flex flex-wrap gap-1">
                            {row.original.tags?.map((tag) => (
                                <Tag variant="muted" size="small">
                                    {tag.name}
                                </Tag>
                            ))}
                        </div>
                    ),
                    enableHiding: true,
                    enableSorting: false,
                },
            ],
            []
        );

        if (isError) {
            return <p className="text-text-destructive">Failed to fetch positions</p>;
        }

        if (isLoading) {
            return <Loading />;
        }

        const activeFiltersRow = (
            <div>
                {activeFilters.length > 0 ? (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        {activeFilters.map(([key, value]) => (
                            <Tag key={key} variant="filter">
                                {positionSearchFiltersLabel[key as keyof typeof appliedFilters]}
                                {": "}
                                {positionSearchFiltersValueFormatter[
                                    key as keyof typeof positionSearchFiltersValueFormatter
                                ]?.(value, appliedFilters) ?? String(value)}
                                <Button
                                    variant="ghost"
                                    size="small"
                                    className="text-input-placeholder hover:text-foreground h-6 p-1"
                                    onClick={() => resetFilter(key as keyof typeof appliedFilters)}
                                >
                                    <IconCross size={14} />
                                </Button>
                            </Tag>
                        ))}
                    </div>
                ) : // <p className="text-text-subtle">No filters applied</p>
                null}
            </div>
        );

        if (positions) {
            return (
                <>
                    <DataTableSmart
                        columns={columns}
                        data={positions}
                        total={totalItems}
                        state={state}
                        onStateChange={onStateChange}
                        isFetching={isFetching}
                        manualPagination
                        manualSorting
                    >
                        {(table) => (
                            <div className="space-y-4">
                                <div className="flex gap-x-2">
                                    {!hideFilters && <PositionListFilters isFetching={isFetching} />}
                                    {!hideColumnVisibility && <DataTableVisibility table={table} />}
                                    <PositionExportButton />
                                </div>

                                {!hideFilters && activeFiltersRow}

                                <div className="grid auto-rows-[140px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1.0fr_0.6fr_1.2fr]">
                                    <div className="relative h-full w-full">
                                        <WidgetPnLCard
                                            gross={new Decimal(generalStats.gross_pnl || 0)}
                                            net={new Decimal(generalStats.net_pnl || 0)}
                                            charges={new Decimal(generalStats.charges || 0)}
                                        />
                                    </div>

                                    <div className="relative h-full w-full">
                                        <WidgetWinRate
                                            winRate={generalStats.win_rate}
                                            totalTradesCount={generalStats.total_trades_count}
                                            winsCount={generalStats.wins_count}
                                            lossesCount={generalStats.losses_count}
                                            breakevensCount={generalStats.breakevens_count}
                                        />
                                    </div>

                                    <div className="relative h-full w-full">
                                        <WidgetProfitFactor profitFactor={new Decimal(generalStats.profit_factor)} />
                                    </div>

                                    <div className="relative h-full w-full">
                                        <WidgetAvgWinLoss
                                            avgWin={new Decimal(generalStats.avg_win || 0)}
                                            avgLoss={new Decimal(generalStats.avg_loss || 0)}
                                            ratio={new Decimal(generalStats.avg_win_loss_ratio)}
                                        />
                                    </div>
                                </div>

                                <DataTable
                                    table={table}
                                    cellClassName={(cell) =>
                                        rightAlignedColumns.includes(cell.column.id) ? "text-right tabular-nums" : ""
                                    }
                                />

                                <DataTablePagination table={table} total={totalItems} />
                            </div>
                        )}
                    </DataTableSmart>
                </>
            );
        }

        return null;
    }
);
