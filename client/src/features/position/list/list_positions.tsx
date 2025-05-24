import { memo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { Button, DatePicker, Input, Label } from "@/s8ly";
import {
    Position,
    positionInstrumentToString,
} from "@/features/position/position";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import {
    dateRangeFilterToDatesArray,
    formatCurrency,
    formatDate,
} from "@/lib/utils";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { PageHeading } from "@/components/page_heading";
import {
    ListPositionContextProvider,
    useListPositions,
} from "@/features/position/list/list_positions_context";
import { WithLabel } from "@/components/with_label";
import { Loading } from "@/components/loading";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { DirectionToggle } from "@/components/toggle/direction_toggle";
import { PositionStatusSelect } from "@/components/select/position_status_select";
import { WithCompare } from "@/components/with_compare";
import { CompareSelect } from "@/components/select/compare_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { WithDebounce } from "@/components/with_debounce";

export const ListPositions = () => {
    const { queryResult } = useListPositions();

    return (
        <>
            <PageHeading
                heading="Positions"
                loading={queryResult?.isFetching}
            />
            <PositionsFilters />
            <PositionsTable />
        </>
    );
};

export default () => (
    <ListPositionContextProvider>
        <ListPositions />
    </ListPositionContextProvider>
);

const PositionsFilters = memo(({}: {}) => {
    const { queryResult, searchFilters, setSearchFilters } = useListPositions();
    // We keep local state of filters and only update the `searchFilters`
    // when user clicks on the `Search` button.
    const [localFilters, setLocalFilters] = useState(searchFilters);

    return (
        <>
            <form>
                <div className="flex flex-wrap gap-x-16 gap-y-8">
                    <WithLabel Label={<Label>Opened</Label>}>
                        <DatePicker
                            mode="range"
                            config={{ dates: { toggle: true } }}
                            dates={dateRangeFilterToDatesArray(
                                localFilters.opened
                            )}
                            onDatesChange={(v) =>
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    opened: {
                                        from: v[0],
                                        to: v[1],
                                    },
                                }))
                            }
                        />
                    </WithLabel>

                    <WithDebounce
                        state={localFilters.symbol}
                        onDebounce={(v) => {
                            setLocalFilters((prev) => ({
                                ...prev,
                                symbol: v,
                            }));
                        }}
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>Symbol</Label>}>
                                <Input
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithDebounce
                        state={localFilters.instrument}
                        onDebounce={(v) => {
                            setLocalFilters((prev) => ({
                                ...prev,
                                instrument: v,
                            }));
                        }}
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>Instrument</Label>}>
                                <InstrumentToggle
                                    value={value}
                                    onChange={(v) => setValue(v)}
                                />
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithLabel Label={<Label>Direction</Label>}>
                        <DirectionToggle
                            value={localFilters.direction}
                            onChange={(v) =>
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    direction: v,
                                }))
                            }
                        />
                    </WithLabel>

                    <WithLabel Label={<Label>Status</Label>}>
                        <PositionStatusSelect
                            value={localFilters.status}
                            onValueChange={(v) =>
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    status: v,
                                }))
                            }
                        />
                    </WithLabel>

                    <WithDebounce
                        state={localFilters.r_factor}
                        onDebounce={(v) => {
                            setLocalFilters((prev) => ({
                                ...prev,
                                r_factor: v,
                            }));
                        }}
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>R Factor</Label>}>
                                <WithCompare
                                    Compare={
                                        <CompareSelect
                                            value={
                                                localFilters.r_factor_operator
                                            }
                                            onValueChange={(v) =>
                                                setLocalFilters((prev) => ({
                                                    ...prev,
                                                    r_factor_operator: v,
                                                }))
                                            }
                                        />
                                    }
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : ""
                                            )
                                        }
                                    />
                                </WithCompare>
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithDebounce
                        state={localFilters.gross_pnl}
                        onDebounce={(v) =>
                            setLocalFilters((prev) => ({
                                ...prev,
                                gross_pnl: v,
                            }))
                        }
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>Gross PnL</Label>}>
                                <WithCompare
                                    Compare={
                                        <CompareSelect
                                            value={
                                                localFilters.gross_pnl_operator
                                            }
                                            onValueChange={(v) =>
                                                setLocalFilters((prev) => ({
                                                    ...prev,
                                                    gross_pnl_operator: v,
                                                }))
                                            }
                                        />
                                    }
                                >
                                    <DecimalInput
                                        kind="amount"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(e.target.value)
                                        }
                                    />
                                </WithCompare>
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithDebounce
                        state={localFilters.net_pnl}
                        onDebounce={(v) =>
                            setLocalFilters((prev) => ({
                                ...prev,
                                net_pnl: v,
                            }))
                        }
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>Net PnL</Label>}>
                                <WithCompare
                                    Compare={
                                        <CompareSelect
                                            value={
                                                localFilters.net_pnl_operator
                                            }
                                            onValueChange={(v) =>
                                                setLocalFilters((prev) => ({
                                                    ...prev,
                                                    net_pnl_operator: v,
                                                }))
                                            }
                                        />
                                    }
                                >
                                    <DecimalInput
                                        kind="amount"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(e.target.value)
                                        }
                                    />
                                </WithCompare>
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithDebounce
                        state={localFilters.net_return_percentage}
                        onDebounce={(v) => {
                            setLocalFilters((prev) => ({
                                ...prev,
                                net_return_percentage: v,
                            }));
                        }}
                    >
                        {(value, setValue) => (
                            <WithLabel Label={<Label>Net Return %</Label>}>
                                <WithCompare
                                    Compare={
                                        <CompareSelect
                                            value={
                                                localFilters.net_return_percentage_operator
                                            }
                                            onValueChange={(v) =>
                                                setLocalFilters((prev) => ({
                                                    ...prev,
                                                    net_return_percentage_operator:
                                                        v,
                                                }))
                                            }
                                        />
                                    }
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : ""
                                            )
                                        }
                                    />
                                </WithCompare>
                            </WithLabel>
                        )}
                    </WithDebounce>

                    <WithDebounce
                        state={localFilters.charges_percentage}
                        onDebounce={(v) =>
                            setLocalFilters((prev) => ({
                                ...prev,
                                charges_percentage: v,
                            }))
                        }
                    >
                        {(value, setValue) => (
                            <WithLabel
                                Label={<Label>Charges % of Net PnL</Label>}
                            >
                                <WithCompare
                                    Compare={
                                        <CompareSelect
                                            value={
                                                localFilters.charges_percentage_operator
                                            }
                                            onValueChange={(v) =>
                                                setLocalFilters((prev) => ({
                                                    ...prev,
                                                    charges_percentage_operator:
                                                        v,
                                                }))
                                            }
                                        />
                                    }
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : ""
                                            )
                                        }
                                    />
                                </WithCompare>
                            </WithLabel>
                        )}
                    </WithDebounce>
                </div>

                <div className="h-8" />

                <Button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        setSearchFilters(localFilters);
                    }}
                    loading={queryResult.isFetching}
                >
                    Search
                </Button>
            </form>

            <div className="h-15" />
        </>
    );
});

const columns: ColumnDef<Position>[] = [
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
        cell: ({ row }) =>
            formatDate(new Date(row.original.opened_at), { time: true }),
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
        cell: ({ row }) => (
            <DirectionTag className="w-16" direction={row.original.direction} />
        ),
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
                status={row.original.status}
                currency={row.original.currency}
            />
        ),
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
            columnVisibilityHeader: "R Factor",
        },
        accessorKey: "r_factor",
        header: ({ column, table }) => (
            <DataTableColumnHeader
                title="R Factor"
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
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
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) =>
            formatCurrency(
                row.original.gross_pnl_amount,
                row.original.currency
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
                column={column}
                disabled={table.options.meta?.isFetching}
            />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.net_pnl_amount, row.original.currency),
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
                disabled={table.options.meta?.isFetching}
                column={column}
            />
        ),
        cell: ({ row }) =>
            `${Number(row.original.charges_as_percentage_of_net_pnl).toFixed(2)}%`,
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
                disabled={table.options.meta?.isFetching}
                column={column}
            />
        ),
        cell: ({ row }) =>
            `${Number(row.original.net_return_percentage).toFixed(2)}%`,
    },
];

const PositionsTable = memo(() => {
    const { queryResult, tableState, setTableState } = useListPositions();

    if (queryResult.isError) {
        return <p className="text-foreground-red">Failed to fetch positions</p>;
    }

    if (queryResult.isLoading) {
        return <Loading />;
    }

    if (queryResult.data) {
        return (
            <>
                <DataTableSmart
                    columns={columns}
                    data={queryResult.data.data.items}
                    total={queryResult.data.data.pagination.total_items}
                    state={tableState}
                    onStateChange={setTableState}
                    isFetching={queryResult?.isFetching}
                />

                <div className="h-10" />
            </>
        );
    }
});
