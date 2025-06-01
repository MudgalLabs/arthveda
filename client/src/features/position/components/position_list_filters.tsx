import { memo, useState, useCallback } from "react";
import { Drawer } from "vaul";

import { Button, DatePicker, Input, Label } from "@/s8ly";
import { IconCross, IconListFilter } from "@/components/icons";
import { cn, dateRangeFilterToDatesArray } from "@/lib/utils";
import { WithLabel } from "@/components/with_label";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { DirectionToggle } from "@/components/toggle/direction_toggle";
import { PositionStatusSelect } from "@/components/select/position_status_select";
import { WithCompare } from "@/components/with_compare";
import { CompareSelect } from "@/components/select/compare_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { SymbolInput } from "@/features/position/components/symbol_input";
import { positionSearchFiltersLabel } from "@/features/position/utils";
import { useListPositionsStore } from "@/features/position/list/list_positions_store";

export const PositionListFilters = memo(
    ({ isFetching = false }: { isFetching?: boolean }) => {
        const opened = useListPositionsStore((s) => s.opened);
        const symbol = useListPositionsStore((s) => s.symbol);
        const instrument = useListPositionsStore((s) => s.instrument);
        const direction = useListPositionsStore((s) => s.direction);
        const status = useListPositionsStore((s) => s.status);
        const r_factor = useListPositionsStore((s) => s.r_factor);
        const r_factor_operator = useListPositionsStore(
            (s) => s.r_factor_operator
        );
        const gross_pnl = useListPositionsStore((s) => s.gross_pnl);
        const gross_pnl_operator = useListPositionsStore(
            (s) => s.gross_pnl_operator
        );
        const net_pnl = useListPositionsStore((s) => s.net_pnl);
        const net_pnl_operator = useListPositionsStore(
            (s) => s.net_pnl_operator
        );
        const net_return_percentage = useListPositionsStore(
            (s) => s.net_return_percentage
        );
        const net_return_percentage_operator = useListPositionsStore(
            (s) => s.net_return_percentage_operator
        );
        const charges_percentage = useListPositionsStore(
            (s) => s.charges_percentage
        );
        const charges_percentage_operator = useListPositionsStore(
            (s) => s.charges_percentage_operator
        );

        const updateFilter = useListPositionsStore((s) => s.updateFilter);
        const applyFilters = useListPositionsStore((s) => s.applyFilters);
        const resetFilters = useListPositionsStore((s) => s.resetFilters);

        const [open, setOpen] = useState(false);

        // Using `useRef` didn't work as expected with the Drawer component.
        const [drawerEl, setContainerEl] = useState<HTMLElement | null>(null);
        const handleRef = useCallback((node: HTMLElement | null) => {
            if (node) setContainerEl(node);
        }, []);

        return (
            <Drawer.Root open={open} onOpenChange={setOpen}>
                <Drawer.Trigger asChild>
                    <Button
                        variant="outline"
                        className={cn("w-full sm:w-fit", {
                            "bg-accent-muted": open,
                        })}
                    >
                        <IconListFilter className="text-foreground" /> Filters
                    </Button>
                </Drawer.Trigger>

                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/50" />
                    <Drawer.Content
                        ref={handleRef}
                        className="bg-background border-border-muted fixed right-0 bottom-0 left-0 z-50 mt-24 flex h-[80%] flex-col rounded-t-[10px] border-1 outline-none lg:h-fit"
                    >
                        <div className="mx-auto max-w-[1440px] flex-1 overflow-y-auto rounded-t-[10px] p-4">
                            <Drawer.Handle />

                            <div className="flex items-center justify-between gap-x-8">
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
                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.opened
                                                }
                                            </Label>
                                        }
                                    >
                                        <DatePicker
                                            container={drawerEl}
                                            mode="range"
                                            config={{ dates: { toggle: true } }}
                                            dates={dateRangeFilterToDatesArray(
                                                opened
                                            )}
                                            onDatesChange={(v) =>
                                                updateFilter("opened", {
                                                    from: v[0],
                                                    to: v[1],
                                                })
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.symbol
                                                }
                                            </Label>
                                        }
                                    >
                                        <SymbolInput
                                            value={symbol}
                                            onChange={(_, v) =>
                                                updateFilter("symbol", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.instrument
                                                }
                                            </Label>
                                        }
                                    >
                                        <InstrumentToggle
                                            value={instrument}
                                            onChange={(v) =>
                                                updateFilter("instrument", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.direction
                                                }
                                            </Label>
                                        }
                                    >
                                        <DirectionToggle
                                            value={direction}
                                            onChange={(v) =>
                                                updateFilter("direction", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.status
                                                }
                                            </Label>
                                        }
                                    >
                                        <PositionStatusSelect
                                            value={status}
                                            onValueChange={(v) =>
                                                updateFilter("status", v)
                                            }
                                        />
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.r_factor
                                                }
                                            </Label>
                                        }
                                    >
                                        <WithCompare
                                            Compare={
                                                <CompareSelect
                                                    container={drawerEl}
                                                    value={r_factor_operator}
                                                    onValueChange={(v) =>
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
                                                value={r_factor}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        "r_factor",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </WithCompare>
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.gross_pnl
                                                }
                                            </Label>
                                        }
                                    >
                                        <WithCompare
                                            Compare={
                                                <CompareSelect
                                                    container={drawerEl}
                                                    value={gross_pnl_operator}
                                                    onValueChange={(v) =>
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
                                                value={gross_pnl}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        "gross_pnl",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </WithCompare>
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.net_pnl
                                                }
                                            </Label>
                                        }
                                    >
                                        <WithCompare
                                            Compare={
                                                <CompareSelect
                                                    container={drawerEl}
                                                    value={net_pnl_operator}
                                                    onValueChange={(v) =>
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
                                                value={net_pnl}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        "net_pnl",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </WithCompare>
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.net_return_percentage
                                                }
                                            </Label>
                                        }
                                    >
                                        <WithCompare
                                            Compare={
                                                <CompareSelect
                                                    container={drawerEl}
                                                    value={
                                                        net_return_percentage_operator
                                                    }
                                                    onValueChange={(v) =>
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
                                                value={net_return_percentage}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        "net_return_percentage",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </WithCompare>
                                    </WithLabel>

                                    <WithLabel
                                        Label={
                                            <Label>
                                                {
                                                    positionSearchFiltersLabel.charges_percentage
                                                }
                                            </Label>
                                        }
                                    >
                                        <WithCompare
                                            Compare={
                                                <CompareSelect
                                                    container={drawerEl}
                                                    value={
                                                        charges_percentage_operator
                                                    }
                                                    onValueChange={(v) =>
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
                                                value={charges_percentage}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        "charges_percentage",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </WithCompare>
                                    </WithLabel>
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
                                        loading={isFetching}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="submit"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            applyFilters();
                                            setOpen(false);
                                        }}
                                        loading={isFetching}
                                    >
                                        Apply
                                    </Button>
                                </div>

                                <div className="h-2" />
                            </form>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }
);
