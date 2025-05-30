import { memo, useState } from "react";
import { Drawer } from "vaul";

import { Button, DatePicker, Input, Label } from "@/s8ly";
import { IconCross, IconListFilter } from "@/components/icons";
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
    const { queryResult, filters, updateFilter, applyFilters, resetFilters } =
        useListPositions();

    const [open, setOpen] = useState(false);

    return (
        <>
            {open && (
                <div
                    id="drawer-overlay"
                    className="fixed inset-0 z-40 bg-black/40"
                    onPointerDown={() => setOpen(false)}
                />
            )}

            <Drawer.Root modal={false} open={open} onOpenChange={setOpen}>
                <Drawer.Trigger asChild>
                    <Button variant="outline">
                        <IconListFilter className="text-foreground" /> Filters
                    </Button>
                </Drawer.Trigger>

                <Drawer.Portal>
                    <Drawer.Content className="bg-background border-border-muted fixed right-0 bottom-0 left-0 z-50 mt-24 flex h-[80%] flex-col rounded-t-[10px] border-1 outline-none lg:h-fit">
                        <div className="mx-auto max-w-[1440px] flex-1 overflow-y-auto rounded-t-[10px] p-4">
                            <Drawer.Handle />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Drawer.Title className="text-foreground heading mt-2">
                                        Filters
                                    </Drawer.Title>
                                    <Drawer.Description className="text-foreground-muted text-sm">
                                        Use the filters below to narrow down
                                        your positions. Click on "Search" to
                                        apply the filters.
                                    </Drawer.Description>
                                </div>

                                <Drawer.Close asChild>
                                    <Button variant="ghost" size="icon">
                                        <IconCross size={20} />
                                    </Button>
                                </Drawer.Close>
                            </div>

                            <form className="mt-8">
                                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    <WithLabel Label={<Label>Opened</Label>}>
                                        <DatePicker
                                            mode="range"
                                            config={{ dates: { toggle: true } }}
                                            dates={dateRangeFilterToDatesArray(
                                                filters.opened
                                            )}
                                            onDatesChange={(v) =>
                                                updateFilter("opened", {
                                                    from: v[0],
                                                    to: v[1],
                                                })
                                            }
                                        />
                                    </WithLabel>

                                    <WithDebounce
                                        state={filters.symbol}
                                        onDebounce={(v) => {
                                            updateFilter("symbol", v);
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
                                        state={filters.instrument}
                                        onDebounce={(v) => {
                                            updateFilter("instrument", v);
                                        }}
                                    >
                                        {(value, setValue) => (
                                            <WithLabel
                                                Label={
                                                    <Label>Instrument</Label>
                                                }
                                            >
                                                <InstrumentToggle
                                                    value={value}
                                                    onChange={(v) =>
                                                        setValue(v)
                                                    }
                                                />
                                            </WithLabel>
                                        )}
                                    </WithDebounce>

                                    <WithLabel Label={<Label>Direction</Label>}>
                                        <DirectionToggle
                                            value={filters.direction}
                                            onChange={(v) =>
                                                updateFilter("direction", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel Label={<Label>Status</Label>}>
                                        <PositionStatusSelect
                                            value={filters.status}
                                            onValueChange={(v) =>
                                                updateFilter("status", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithDebounce
                                        state={filters.r_factor}
                                        onDebounce={(v) => {
                                            updateFilter("r_factor", v);
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
                                                                filters.r_factor_operator
                                                            }
                                                            onValueChange={(
                                                                v
                                                            ) =>
                                                                updateFilter(
                                                                    "r_factor_operator",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                    }
                                                >
                                                    <Input
                                                        className="w-20!"
                                                        type="number"
                                                        step="0.01"
                                                        value={value}
                                                        onChange={(e) =>
                                                            setValue(
                                                                e.target.value
                                                                    ? Number(
                                                                          e
                                                                              .target
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
                                        state={filters.gross_pnl}
                                        onDebounce={(v) =>
                                            updateFilter("gross_pnl", v)
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
                                                                filters.gross_pnl_operator
                                                            }
                                                            onValueChange={(
                                                                v
                                                            ) =>
                                                                updateFilter(
                                                                    "gross_pnl_operator",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                    }
                                                >
                                                    <DecimalInput
                                                        kind="amount"
                                                        value={value}
                                                        onChange={(e) =>
                                                            setValue(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </WithCompare>
                                            </WithLabel>
                                        )}
                                    </WithDebounce>

                                    <WithDebounce
                                        state={filters.net_pnl}
                                        onDebounce={(v) =>
                                            updateFilter("net_pnl", v)
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
                                                                filters.net_pnl_operator
                                                            }
                                                            onValueChange={(
                                                                v
                                                            ) =>
                                                                updateFilter(
                                                                    "net_pnl_operator",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                    }
                                                >
                                                    <DecimalInput
                                                        kind="amount"
                                                        value={value}
                                                        onChange={(e) =>
                                                            setValue(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </WithCompare>
                                            </WithLabel>
                                        )}
                                    </WithDebounce>

                                    <WithDebounce
                                        state={filters.net_return_percentage}
                                        onDebounce={(v) => {
                                            updateFilter(
                                                "net_return_percentage",
                                                v
                                            );
                                        }}
                                    >
                                        {(value, setValue) => (
                                            <WithLabel
                                                Label={
                                                    <Label>Net Return %</Label>
                                                }
                                            >
                                                <WithCompare
                                                    Compare={
                                                        <CompareSelect
                                                            value={
                                                                filters.net_return_percentage_operator
                                                            }
                                                            onValueChange={(
                                                                v
                                                            ) =>
                                                                updateFilter(
                                                                    "net_return_percentage_operator",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                    }
                                                >
                                                    <Input
                                                        className="w-20!"
                                                        type="number"
                                                        step="0.01"
                                                        value={value}
                                                        onChange={(e) =>
                                                            setValue(
                                                                e.target.value
                                                                    ? Number(
                                                                          e
                                                                              .target
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
                                        state={filters.charges_percentage}
                                        onDebounce={(v) =>
                                            updateFilter(
                                                "charges_percentage",
                                                v
                                            )
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
                                                                filters.charges_percentage_operator
                                                            }
                                                            onValueChange={(
                                                                v
                                                            ) =>
                                                                updateFilter(
                                                                    "charges_percentage_operator",
                                                                    v
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
                                                                          e
                                                                              .target
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

                                <div className="flex flex-col justify-end gap-x-2 gap-y-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            resetFilters();
                                            setOpen(false);
                                        }}
                                        loading={queryResult.isFetching}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            applyFilters();
                                            setOpen(false);
                                        }}
                                        loading={queryResult.isFetching}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
});
