import { memo, useState, useMemo } from "react";

import { Button, DatePicker, Input, Label } from "@/s8ly";
import { dateRangeFilterToDatesArray } from "@/lib/utils";
import { PageHeading } from "@/components/page_heading";
import {
    ListPositionContextProvider,
    useListPositions,
} from "@/features/position/list/list_positions_context";
import { WithLabel } from "@/components/with_label";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { DirectionToggle } from "@/components/toggle/direction_toggle";
import { PositionStatusSelect } from "@/components/select/position_status_select";
import { WithCompare } from "@/components/with_compare";
import { CompareSelect } from "@/components/select/compare_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { WithDebounce } from "@/components/with_debounce";
import { PositionsTable } from "@/features/position/components/list_table";

export const ListPositions = () => {
    const { queryResult, tableState, setTableState } = useListPositions();

    const positions = useMemo(() => {
        if (queryResult.data?.data.items) {
            return Array.from(queryResult.data?.data.items);
        }
        return [];
    }, [queryResult]);

    return (
        <>
            <PageHeading
                heading="Positions"
                loading={queryResult?.isFetching}
            />

            <PositionsFilters />

            {queryResult.data && (
                <>
                    <PositionsTable
                        positions={positions}
                        totalItems={
                            queryResult.data.data.pagination.total_items
                        }
                        state={tableState}
                        onStateChange={setTableState}
                        isLoading={queryResult.isLoading}
                        isError={queryResult.isError}
                        isFetching={queryResult.isFetching}
                    />
                </>
            )}
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
                {/* <div className="flex flex-wrap gap-x-16 gap-y-8"> */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                                        className="w-24!"
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
                                        className="w-24!"
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
                                        className="w-24!"
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
