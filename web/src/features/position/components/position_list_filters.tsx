import { memo, useState, useCallback } from "react";
import { Drawer } from "vaul";

import { Button, DatePicker, Input, Label } from "netra";
import { IconCross, IconListFilter } from "@/components/icons";
import { cn, dateRangeFilterToDatesArray } from "@/lib/utils";
import { WithLabel } from "@/components/with_label";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { DirectionToggle } from "@/components/toggle/direction_toggle";
import { PositionStatusFilterValue, PositionStatusSelect } from "@/components/select/position_status_select";
import { WithCompare } from "@/components/with_compare";
import { CompareOperator, CompareSelect } from "@/components/select/compare_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { SymbolSearch } from "@/features/position/components/symbol_search";
import { positionSearchFiltersLabel } from "@/features/position/utils";
import { useListPositionsStore } from "@/features/position/list_positions_store";
import { PositionDirection, PositionInstrument } from "../position";

export const PositionListFilters = memo(({ isFetching = false }: { isFetching?: boolean }) => {
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
                    variant="secondary"
                    className={cn("w-full enabled:active:scale-[1]! sm:w-fit", {
                        "bg-secondary-hover": open,
                    })}
                >
                    <IconListFilter className="text-foreground" /> Filters
                </Button>
            </Drawer.Trigger>

            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50" />
                <Drawer.Content
                    ref={handleRef}
                    className="bg-surface-1 border-border-soft fixed right-0 bottom-0 left-0 z-50 mt-24 flex h-[80%] flex-col rounded-t-[10px] border-1 outline-none lg:h-fit"
                >
                    <div className="mx-auto max-w-[1440px] flex-1 overflow-y-auto rounded-t-[10px] p-4">
                        <Drawer.Handle />

                        <div className="flex items-center justify-between gap-x-8">
                            <div>
                                <Drawer.Title className="text-foreground heading mt-2">Filters</Drawer.Title>
                                <Drawer.Description className="text-foreground-muted text-sm">
                                    Use the filters below to narrow down your positions. Click on "Apply" to apply the
                                    filters.
                                </Drawer.Description>
                            </div>

                            <Drawer.Close asChild>
                                <Button variant="ghost" size="icon">
                                    <IconCross size={18} />
                                </Button>
                            </Drawer.Close>
                        </div>

                        <form className="mt-8">
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <OpenedFilter container={drawerEl} />
                                <SymbolInputField />
                                <InstrumentFilter />
                                <DirectionFilter />
                                <StatusFilter />
                                <RFactorFilter container={drawerEl} />
                                <GrossPnlFilter container={drawerEl} />
                                <NetPnlFilter container={drawerEl} />
                                <NetReturnPercentageFilter container={drawerEl} />
                                <ChargesPercentageFilter container={drawerEl} />
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
});

const OpenedFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const opened = useListPositionsStore((s) => s.opened);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.opened}</Label>}>
            <DatePicker
                container={container}
                mode="range"
                config={{ dates: { toggle: true } }}
                dates={dateRangeFilterToDatesArray(opened)}
                onDatesChange={(v: Date[]) => updateFilter("opened", { from: v[0], to: v[1] })}
                popoverContentProps={{
                    align: "start",
                }}
            />
        </WithLabel>
    );
});

const SymbolInputField = memo(() => {
    const symbol = useListPositionsStore((s) => s.symbol);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.symbol}</Label>}>
            <SymbolSearch value={symbol} onChange={(v) => updateFilter("symbol", v)} />
        </WithLabel>
    );
});

const InstrumentFilter = memo(() => {
    const instrument = useListPositionsStore((s) => s.instrument);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.instrument}</Label>}>
            <InstrumentToggle
                value={instrument}
                onChange={(v: PositionInstrument | "") => updateFilter("instrument", v)}
            />
        </WithLabel>
    );
});

const DirectionFilter = memo(() => {
    const direction = useListPositionsStore((s) => s.direction);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.direction}</Label>}>
            <DirectionToggle value={direction} onChange={(v: PositionDirection | "") => updateFilter("direction", v)} />
        </WithLabel>
    );
});

const StatusFilter = memo(() => {
    const status = useListPositionsStore((s) => s.status);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.status}</Label>}>
            <PositionStatusSelect
                value={status}
                onValueChange={(v: PositionStatusFilterValue) => updateFilter("status", v)}
            />
        </WithLabel>
    );
});

const RFactorFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const r_factor = useListPositionsStore((s) => s.r_factor);
    const r_factor_operator = useListPositionsStore((s) => s.r_factor_operator);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.r_factor}</Label>}>
            <WithCompare
                Compare={
                    <CompareSelect
                        container={container}
                        value={r_factor_operator}
                        onValueChange={(v: CompareOperator) => updateFilter("r_factor_operator", v)}
                    />
                }
            >
                <Input
                    className="w-20!"
                    type="number"
                    step="0.01"
                    value={r_factor}
                    onChange={(e) => updateFilter("r_factor", e.target.value)}
                />
            </WithCompare>
        </WithLabel>
    );
});

const GrossPnlFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const gross_pnl = useListPositionsStore((s) => s.gross_pnl);
    const gross_pnl_operator = useListPositionsStore((s) => s.gross_pnl_operator);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.gross_pnl}</Label>}>
            <WithCompare
                Compare={
                    <CompareSelect
                        container={container}
                        value={gross_pnl_operator}
                        onValueChange={(v: CompareOperator) => updateFilter("gross_pnl_operator", v)}
                    />
                }
            >
                <DecimalInput
                    kind="amount"
                    value={gross_pnl}
                    onChange={(e) => updateFilter("gross_pnl", e.target.value)}
                />
            </WithCompare>
        </WithLabel>
    );
});

const NetPnlFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const net_pnl = useListPositionsStore((s) => s.net_pnl);
    const net_pnl_operator = useListPositionsStore((s) => s.net_pnl_operator);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.net_pnl}</Label>}>
            <WithCompare
                Compare={
                    <CompareSelect
                        container={container}
                        value={net_pnl_operator}
                        onValueChange={(v: CompareOperator) => updateFilter("net_pnl_operator", v)}
                    />
                }
            >
                <DecimalInput kind="amount" value={net_pnl} onChange={(e) => updateFilter("net_pnl", e.target.value)} />
            </WithCompare>
        </WithLabel>
    );
});

const NetReturnPercentageFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const net_return_percentage = useListPositionsStore((s) => s.net_return_percentage);
    const net_return_percentage_operator = useListPositionsStore((s) => s.net_return_percentage_operator);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.net_return_percentage}</Label>}>
            <WithCompare
                Compare={
                    <CompareSelect
                        container={container}
                        value={net_return_percentage_operator}
                        onValueChange={(v: CompareOperator) => updateFilter("net_return_percentage_operator", v)}
                    />
                }
            >
                <Input
                    className="w-20!"
                    type="number"
                    step="0.01"
                    value={net_return_percentage}
                    onChange={(e) => updateFilter("net_return_percentage", e.target.value)}
                />
            </WithCompare>
        </WithLabel>
    );
});

const ChargesPercentageFilter = memo(({ container }: { container: HTMLElement | null }) => {
    const charges_percentage = useListPositionsStore((s) => s.charges_percentage);
    const charges_percentage_operator = useListPositionsStore((s) => s.charges_percentage_operator);
    const updateFilter = useListPositionsStore((s) => s.updateFilter);

    return (
        <WithLabel Label={<Label>{positionSearchFiltersLabel.charges_percentage}</Label>}>
            <WithCompare
                Compare={
                    <CompareSelect
                        container={container}
                        value={charges_percentage_operator}
                        onValueChange={(v: CompareOperator) => updateFilter("charges_percentage_operator", v)}
                    />
                }
            >
                <Input
                    className="w-24!"
                    type="number"
                    step="0.01"
                    value={charges_percentage}
                    onChange={(e) => updateFilter("charges_percentage", e.target.value)}
                />
            </WithCompare>
        </WithLabel>
    );
});
