import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Dialog,
    DialogFooter,
    DialogHeader,
    Label,
    Tooltip,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    useDocumentTitle,
    Loading,
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
    IconCandlestick,
    IconSquarePen,
    PageHeading,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "netra";

import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { WithLabel } from "@/components/with_label";
import { IconCalendarRange } from "@/components/icons";
import { Card, CardContent, CardTitle } from "@/components/card";
import { formatDate, getElapsedTime } from "@/lib/utils";
import { DecimalInput } from "@/components/input/decimal_input";
import { CreateTrade } from "@/features/trade/trade";
import { apiHooks } from "@/hooks/api_hooks";
import { toast } from "@/components/toast";
import { DirectionTag } from "@/features/position/components/direction_tag";
import { StatusTag } from "@/features/position/components/status_tag";
import { apiErrorHandler } from "@/lib/api";
import { WithDebounce } from "@/components/with_debounce";
import { SymbolInput } from "@/features/position/components/symbol_input";
import { usePositionStore } from "@/features/position/position_store_context";
import { ComputePositionResponse } from "@/lib/api/position";
import {
    usePositionCanBeSaved,
    useHasPositionDataChanged,
    usePositionCanBeComputed,
    useIsCreatingPosition,
    useIsEditingPosition,
} from "@/features/position/position_store";
import { OverviewCard } from "@/features/dashboard/widget/widget_overview_card";
import { ROUTES } from "@/constants";
import { useLatest } from "@/hooks/use_latest";
import { UserBrokerAccountSearch } from "@/features/broker/components/user_broker_account_search";
import { BrokerAccountInfoTooltip } from "@/features/broker/components/broker_account_info_tooltip";
import { Link } from "@/components/link";
import { PositionLogTrades } from "@/features/position/components/position_log/position_log_trades";
import { PositionLogNotes } from "@/features/position/components/position_log/position_log_notes";
import { collectUploadIds } from "@/features/position/utils";

const enum PositionLogTab {
    Trades = "trades",
    Notes = "notes",
}

function PositionLog() {
    const isCreatingPosition = useIsCreatingPosition();
    const isEditingPosition = useIsEditingPosition();
    const [tab, setTab] = useState<string>(PositionLogTab.Trades);

    const navigate = useNavigate();

    const { mutateAsync: create, isPending: isCreating } = apiHooks.position.useCreate({
        onSuccess: async (res) => {
            const positionID = res.data.data.position.id;
            toast.success("Position Created", {
                action: {
                    label: "View",
                    onClick: () => {
                        navigate(ROUTES.viewPosition(positionID));
                    },
                },
            });

            discard();
        },
        onError: apiErrorHandler,
    });

    const { mutateAsync: update, isPending: isUpdating } = apiHooks.position.useUpdate({
        onSuccess: async () => {
            toast.success("Position Updated");
        },
        onError: apiErrorHandler,
    });

    const { mutateAsync: deletePosition, isPending: isDeleting } = apiHooks.position.useDelete({
        onSuccess: async () => {
            toast.success("Position Deleted");
            navigate(ROUTES.listPositions);
        },
        onError: apiErrorHandler,
    });

    const setTrades = usePositionStore((s) => s.setTrades);

    const { mutateAsync: compute, isPending: isComputing } = apiHooks.position.useCompute({
        onSuccess: async (res) => {
            const data = res.data.data as ComputePositionResponse;

            const charges = data.trade_charges || [];

            if (charges.length === position.trades?.length) {
                setTrades((trades) =>
                    trades.map((trade, index) => ({
                        ...trade,
                        charges_amount: charges[index] || "0",
                    }))
                );
            }

            updatePosition({
                ...data,
                opened_at: new Date(data.opened_at),
                closed_at: data.closed_at ? new Date(data.closed_at) : null,
            });
        },
        onError: apiErrorHandler,
    });

    const position = usePositionStore((s) => s.position);
    const positionLatest = useLatest(position);
    const discard = usePositionStore((s) => s.discard);
    const updatePosition = usePositionStore((s) => s.updatePosition);
    const [canCompute, setCanCompute] = usePositionCanBeComputed();
    const canSave = usePositionCanBeSaved();
    const hasPositionDataChanged = useHasPositionDataChanged();

    const handleClickSave = () => {
        if (!canSave) return;

        const data = {
            risk_amount: position.risk_amount || "0",
            symbol: position.symbol,
            instrument: position.instrument,
            currency: position.currency,
            // notes: position.notes,
            broker_id: position.user_broker_account?.broker_id || null,
            user_broker_account_id: position.user_broker_account_id,
            journal_content: position.journal_content || null,
            active_upload_ids: collectUploadIds(position.journal_content ?? []),
            trades: (position.trades || []).map((t) => {
                // Removing fields that are not required by the API.
                // We are removing these fields because the API will throw an error if we send them.
                return {
                    kind: t.kind,
                    time: t.time,
                    quantity: t.quantity || "0",
                    price: t.price || "0",
                    charges_amount: t.charges_amount || "0",
                    broker_trade_id: t.broker_trade_id,
                };
            }),
        };

        if (isCreatingPosition) {
            create(data);
        } else if (isEditingPosition) {
            update({ id: position.id, body: data });
        }
    };

    const enableAutoCharges = usePositionStore((s) => s.enableAutoCharges);

    useEffect(() => {
        const position = positionLatest.current;

        if (canCompute) {
            compute({
                trades: (position.trades || []).map((t) => {
                    const trade: CreateTrade = {
                        kind: t.kind,
                        time: t.time,
                        quantity: t.quantity || "0",
                        price: t.price || "0",
                        charges_amount: t.charges_amount || "0",
                        broker_trade_id: t.broker_trade_id || null,
                    };

                    return trade;
                }),
                risk_amount: position.risk_amount || "0",
                instrument: position.instrument,
                enable_auto_charges: enableAutoCharges,
                broker_id: position.user_broker_account?.broker_id || null,
            });

            setCanCompute(false);
        }
    }, [compute, canCompute, enableAutoCharges, positionLatest]);

    const disablePrimaryButton = (isEditingPosition && !hasPositionDataChanged) || !canSave;

    const title = `${isCreatingPosition ? "New position" : position.symbol}`;
    useDocumentTitle(`${title} • Arthveda`);

    return (
        <>
            <PageHeading>
                {isCreatingPosition ? (
                    <>
                        <IconSquarePen size={18} />
                        <h1>{title}</h1>
                    </>
                ) : (
                    <div className="flex-x gap-x-8">
                        <div className="flex-x">
                            <IconCandlestick size={18} />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link className="text-[16px]! font-medium!" to={ROUTES.listPositions}>
                                                Positions
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>

                                    <BreadcrumbSeparator />

                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{title}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>
                )}

                {isComputing && <Loading />}
            </PageHeading>

            <div className="flex flex-col gap-y-8 lg:flex-row!">
                <div className="border-r-border-subtle min-w-[360px] border-r-1 lg:pr-4">
                    <div className="flex flex-col items-stretch gap-x-6 gap-y-4 sm:flex-row lg:flex-col!">
                        <div className="flex h-fit gap-x-2">
                            <StatusTag
                                currency={position.currency}
                                status={position.status}
                                openAvgPrice={position.open_average_price_amount}
                                openQuantity={position.open_quantity}
                            />
                            <DirectionTag direction={position.direction} />
                        </div>

                        <OverviewCard
                            className="min-w-72"
                            total_charges_amount={position.total_charges_amount}
                            charges_as_percentage_of_net_pnl={position.charges_as_percentage_of_net_pnl}
                            currency={position.currency}
                            gross_pnl_amount={position.gross_pnl_amount}
                            net_pnl_amount={position.net_pnl_amount}
                            net_return_percentage={position.net_return_percentage}
                            r_factor={position.r_factor}
                        />

                        <DurationCard opened_at={position.opened_at} closed_at={position.closed_at} />
                    </div>

                    <div className="h-4" />

                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
                        <WithDebounce
                            state={position.symbol}
                            onDebounce={(v) => {
                                updatePosition({
                                    symbol: v,
                                });
                            }}
                        >
                            {(value, setValue) => (
                                <WithLabel Label={<Label>Symbol</Label>}>
                                    <SymbolInput
                                        variant={value ? "default" : "error"}
                                        value={value}
                                        onChange={(v) => setValue(v)}
                                        aria-invalid={!value}
                                        errorMsg="Symbol is required"
                                        placeholder="HDFCBANK"
                                    />
                                </WithLabel>
                            )}
                        </WithDebounce>

                        <WithLabel Label={<Label>Instrument</Label>}>
                            <InstrumentToggle
                                value={position.instrument}
                                onChange={(value) =>
                                    value &&
                                    updatePosition({
                                        instrument: value,
                                    })
                                }
                            />
                        </WithLabel>

                        <WithDebounce
                            state={position.risk_amount}
                            onDebounce={(v) => {
                                updatePosition({
                                    risk_amount: v,
                                });
                            }}
                        >
                            {(value, setValue) => (
                                <WithLabel Label={<Label>Risk</Label>}>
                                    <DecimalInput
                                        kind="amount"
                                        currency={position.currency}
                                        value={value}
                                        onChange={(e) => {
                                            setValue(e.target.value);
                                        }}
                                        placeholder="1,000"
                                    />
                                </WithLabel>
                            )}
                        </WithDebounce>

                        <WithLabel
                            Label={
                                <div className="flex-x">
                                    <Label>Broker Account</Label>
                                    <BrokerAccountInfoTooltip />
                                </div>
                            }
                        >
                            <UserBrokerAccountSearch
                                value={position.user_broker_account}
                                onChange={(v) =>
                                    updatePosition({
                                        user_broker_account_id: v ? v.id : null,
                                        user_broker_account: v,
                                    })
                                }
                                variant={!position.user_broker_account && enableAutoCharges ? "error" : "default"}
                                errorMsg="Broker Account is required to calculate charges"
                            />
                        </WithLabel>
                        <div className="h-4" />
                    </div>
                </div>

                <div className="w-full lg:pl-4">
                    <Tabs defaultValue="trades" value={tab} onValueChange={setTab}>
                        <TabsList>
                            <TabsTrigger value="trades">Trades</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>

                        <div className="h-8" />

                        <TabsContent value="trades">
                            <PositionLogTrades />
                        </TabsContent>

                        <TabsContent value="notes">
                            <PositionLogNotes />
                        </TabsContent>
                    </Tabs>

                    <div className="h-8" />

                    <div className="flex flex-col justify-between gap-x-12 gap-y-4 sm:flex-row">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                            {isEditingPosition && (
                                <DeleteButton
                                    deletePosition={() => deletePosition(position.id)}
                                    isDeleting={isDeleting}
                                />
                            )}
                        </div>

                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                            <DiscardButton hasSomethingToDiscard={hasPositionDataChanged} discard={discard} />

                            <Tooltip
                                content={isEditingPosition ? "No changes to save" : "Some required fields are missing"}
                                disabled={!disablePrimaryButton}
                            >
                                <Button
                                    onClick={handleClickSave}
                                    loading={isCreating || isUpdating}
                                    disabled={disablePrimaryButton}
                                >
                                    {isCreatingPosition ? "Create" : "Update"}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="h-8" />
                </div>
            </div>
        </>
    );
}

export default PositionLog;

const DurationCard = memo(({ opened_at, closed_at }: { opened_at: Date; closed_at: Date | null }) => {
    const now = new Date();

    const { days, hours, minutes } = getElapsedTime(opened_at, closed_at ?? now);

    return (
        <Card className="realtive flex min-w-fit flex-col gap-y-2">
            <CardTitle>Duration</CardTitle>

            <CardContent className="flex-center flex h-full flex-col gap-y-2">
                <p className="heading">
                    {days} days {hours} hours {minutes} mins
                </p>

                <div className="flex items-center gap-x-1 text-sm">
                    <IconCalendarRange />
                    <div className="space-x-2">
                        <span>{formatDate(opened_at, { time: true })}</span>
                        {closed_at && <span>- {formatDate(closed_at, { time: true })}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

const DiscardButton = memo(
    ({ hasSomethingToDiscard, discard }: { hasSomethingToDiscard: boolean; discard: () => void }) => {
        return (
            <Dialog>
                <Tooltip content="No changes to discard" disabled={hasSomethingToDiscard}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" disabled={!hasSomethingToDiscard}>
                            Discard
                        </Button>
                    </DialogTrigger>
                </Tooltip>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard</DialogTitle>
                        <DialogDescription>Are you sure you want to disacard this position?</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="destructive" onClick={() => discard()}>
                                Discard
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

const DeleteButton = memo(
    ({ deletePosition, isDeleting }: { deletePosition: () => Promise<void>; isDeleting?: boolean }) => {
        const [open, setOpen] = useState(false);

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Position</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this position?</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                                await deletePosition();
                                setOpen(false);
                            }}
                            loading={isDeleting}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);
