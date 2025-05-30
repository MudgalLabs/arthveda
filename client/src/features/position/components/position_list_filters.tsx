import { memo, useState } from "react";
import { Drawer } from "vaul";

import { Button, DatePicker, Input, Label } from "@/s8ly";
import { IconListFilter } from "@/components/icons";
import { dateRangeFilterToDatesArray } from "@/lib/utils";
import { WithLabel } from "@/components/with_label";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { DirectionToggle } from "@/components/toggle/direction_toggle";
import { PositionStatusSelect } from "@/components/select/position_status_select";
import { WithCompare } from "@/components/with_compare";
import { CompareSelect } from "@/components/select/compare_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { WithDebounce } from "@/components/with_debounce";
import { useListPositions } from "@/features/position/list/list_positions_context";

export const PositionListFilters = memo(({}: {}) => {
    const { queryResult, searchFilters, setSearchFilters } = useListPositions();
    // We keep local state of filters and only update the `searchFilters`
    // when user clicks on the `Search` button.
    const [localFilters, setLocalFilters] = useState(searchFilters);

    return (
        <Drawer.Root>
            <Drawer.Trigger asChild>
                <Button variant="outline">
                    <IconListFilter className="text-foreground" /> Filters
                </Button>
            </Drawer.Trigger>

            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 mt-24 flex h-[80%] flex-col rounded-t-[10px] bg-gray-100 outline-none lg:h-[480px]">
                    <div className="bg-background flex-1 overflow-y-auto rounded-t-[10px] p-4">
                        <Drawer.Handle />
                        <Drawer.Title className="text-foreground heading mt-2">
                            Filters
                        </Drawer.Title>
                        <Drawer.Description className="text-foreground-muted text-sm">
                            Use the filters below to narrow down your positions.
                            Click on "Search" to apply the filters.
                        </Drawer.Description>

                        <form className="mt-8">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
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
                                        <WithLabel
                                            Label={<Label>Symbol</Label>}
                                        >
                                            <Input
                                                value={value}
                                                onChange={(e) =>
                                                    setValue(e.target.value)
                                                }
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
                                        <WithLabel
                                            Label={<Label>Instrument</Label>}
                                        >
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
                                        <WithLabel
                                            Label={<Label>R Factor</Label>}
                                        >
                                            <WithCompare
                                                Compare={
                                                    <CompareSelect
                                                        value={
                                                            localFilters.r_factor_operator
                                                        }
                                                        onValueChange={(v) =>
                                                            setLocalFilters(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    r_factor_operator:
                                                                        v,
                                                                })
                                                            )
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
                                                                ? Number(
                                                                      e.target
                                                                          .value
                                                                  )
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
                                        <WithLabel
                                            Label={<Label>Gross PnL</Label>}
                                        >
                                            <WithCompare
                                                Compare={
                                                    <CompareSelect
                                                        value={
                                                            localFilters.gross_pnl_operator
                                                        }
                                                        onValueChange={(v) =>
                                                            setLocalFilters(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    gross_pnl_operator:
                                                                        v,
                                                                })
                                                            )
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
                                        <WithLabel
                                            Label={<Label>Net PnL</Label>}
                                        >
                                            <WithCompare
                                                Compare={
                                                    <CompareSelect
                                                        value={
                                                            localFilters.net_pnl_operator
                                                        }
                                                        onValueChange={(v) =>
                                                            setLocalFilters(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    net_pnl_operator:
                                                                        v,
                                                                })
                                                            )
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
                                        <WithLabel
                                            Label={<Label>Net Return %</Label>}
                                        >
                                            <WithCompare
                                                Compare={
                                                    <CompareSelect
                                                        value={
                                                            localFilters.net_return_percentage_operator
                                                        }
                                                        onValueChange={(v) =>
                                                            setLocalFilters(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    net_return_percentage_operator:
                                                                        v,
                                                                })
                                                            )
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
                                                                ? Number(
                                                                      e.target
                                                                          .value
                                                                  )
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
                                            Label={
                                                <Label>
                                                    Charges % of Net PnL
                                                </Label>
                                            }
                                        >
                                            <WithCompare
                                                Compare={
                                                    <CompareSelect
                                                        value={
                                                            localFilters.charges_percentage_operator
                                                        }
                                                        onValueChange={(v) =>
                                                            setLocalFilters(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    charges_percentage_operator:
                                                                        v,
                                                                })
                                                            )
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
                                                                ? Number(
                                                                      e.target
                                                                          .value
                                                                  )
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
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
});
