import { useMemo, useState } from "react";
import { DPDay, useDatePicker } from "@rehookify/datepicker";
import Decimal from "decimal.js";

import {
    Button,
    cn,
    formatCurrency,
    formatDate,
    IconChevronLeft,
    IconChevronRight,
    Separator,
    useControlled,
} from "netra";
import { GetCalendarResponse } from "@/lib/api/calendar";
import { PnL } from "@/components/pnl";
import { ListPositionsModal } from "@/components/list_positions_modal";
import { apiHooks } from "@/hooks/api_hooks";

const enum ViewMode {
    ALL = "all",
    YEARLY = "yearly",
    MONTHLY = "monthly",
}

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

interface TradingCalendarProps {
    data: GetCalendarResponse;
    shrinkedView?: boolean;
}

export function TradingCalendar(props: TradingCalendarProps) {
    const { data, shrinkedView } = props;

    const now = new Date();

    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MONTHLY);

    const [selectedDates, onDatesChange] = useState<Date[]>([]);
    const [offsetDate, onOffsetChange] = useState<Date>(new Date());

    const {
        data: { weekDays, calendars },
        propGetters: { addOffset, subtractOffset },
    } = useDatePicker({
        selectedDates,
        onDatesChange,
        offsetDate,
        onOffsetChange,
        calendar: { mode: "fluid" },
    });

    const isMonthlyView = viewMode === ViewMode.MONTHLY;

    const { days, year, month } = calendars[0];

    const monthData = useMemo(() => {
        return data[Number(year)]?.[month];
    }, [data, month, year]);

    // Disable going to next month if it's the current month or there is no data for next month in current year.
    const disableNextMonth = Number(year) === now.getFullYear() && MONTHS.indexOf(month) === now.getMonth();

    // Allow going to previous month only if there is data for previous year or current month is not January.
    const disablePrevMonth = !data.hasOwnProperty(Number(year) - 1) && month === "January";

    const content = useMemo(() => {
        if (isMonthlyView) {
            return <MonthlyCalendar data={data} shrink={shrinkedView} offsetDate={offsetDate} />;
        }

        if (viewMode === ViewMode.YEARLY) {
            return (
                <ul className="flex flex-wrap gap-4">
                    {MONTHS.map((month, idx) => {
                        const monthData = data[Number(year)]?.[month];
                        const isFuture =
                            Number(year) > now.getFullYear() ||
                            (Number(year) === now.getFullYear() && idx > now.getMonth());

                        return (
                            <li key={month}>
                                <PnLTile
                                    title={month}
                                    pnl={new Decimal(monthData?.pnl ?? 0)}
                                    noOfPositions={monthData?.positions_count ?? 0}
                                    onClick={() => {
                                        setViewMode(ViewMode.MONTHLY);
                                        onOffsetChange(new Date(Number(year), idx, now.getDate()));
                                    }}
                                    disabled={isFuture}
                                />
                            </li>
                        );
                    })}
                </ul>
            );
        }
    }, [
        days,
        monthData,
        weekDays,
        shrinkedView,
        viewMode,
        isMonthlyView,
        offsetDate,
        year,
        now,
        onOffsetChange,
        setViewMode,
    ]);

    return (
        <section className="flex h-full w-full flex-col">
            {selectedDates.length > 0 ? <h1>{selectedDates[0].toDateString()}</h1> : null}

            <header className="mb-2">
                <div
                    className={cn("flex flex-col gap-x-8 gap-y-2", {
                        "sm:flex-row": !shrinkedView,
                    })}
                >
                    <div
                        className={cn("flex w-full items-center justify-between", {
                            "sm:w-[220px]!": !shrinkedView,
                            "justify-center": !isMonthlyView,
                        })}
                    >
                        {isMonthlyView && (
                            <Button
                                variant="ghost"
                                size="icon"
                                {...subtractOffset({ months: 1 })}
                                disabled={disablePrevMonth}
                            >
                                <IconChevronLeft size={18} />
                            </Button>
                        )}

                        <span className="space-x-2">
                            {isMonthlyView && (
                                <Button variant="link" onClick={() => setViewMode(ViewMode.YEARLY)}>
                                    {month}
                                </Button>
                            )}

                            <Button variant="link">{year}</Button>
                        </span>

                        {isMonthlyView && (
                            <Button
                                variant="ghost"
                                size="icon"
                                {...addOffset({ months: 1 })}
                                disabled={disableNextMonth}
                            >
                                <IconChevronRight size={18} />
                            </Button>
                        )}
                    </div>

                    <div className="flex-center sm:flex-x gap-x-4!">
                        {monthData?.pnl && (
                            <PnL value={new Decimal(monthData.pnl)} className="text-xl font-semibold">
                                {formatCurrency(monthData.pnl)}
                            </PnL>
                        )}

                        {monthData?.positions_count && (
                            <p className="text-text-muted">{monthData.positions_count} positions</p>
                        )}
                    </div>
                </div>

                <Separator className="my-4" />
            </header>

            {content}
        </section>
    );
}

interface MonthlyCalendarProps {
    data: GetCalendarResponse;
    offsetDate?: Date;
    shrink?: boolean;
    onClickOpen?: () => void;
}

function MonthlyCalendar(props: MonthlyCalendarProps) {
    const { data, shrink, offsetDate: offsetDateProp, onClickOpen } = props;

    const [selectedDates, onDatesChange] = useState<Date[]>([]);
    const [offsetDate, onOffsetChange] = useControlled({
        controlled: offsetDateProp,
        default: new Date(),
        name: "TradingCalendar.Monthly",
        state: "offsetDate",
    });

    const {
        data: { weekDays, calendars },
    } = useDatePicker({
        selectedDates,
        onDatesChange,
        offsetDate,
        onOffsetChange,
        calendar: { mode: "fluid" },
    });

    const { year, month, days } = calendars[0];

    const monthData = useMemo(() => {
        return data[Number(year)]?.[month];
    }, [data, month, year]);

    return (
        <section
            className={cn("flex h-full w-full flex-col", {
                "border-border-subtle rounded-md border-1 p-2": shrink,
            })}
        >
            {shrink && (
                <div className="flex-x mx-2 mt-0 mb-4 justify-between">
                    <span className={cn("text-center font-semibold", { "text-lg": !shrink })}>
                        {month.slice(0, 3)}, {year}
                    </span>

                    <Button variant="ghost" size="small" onClick={onClickOpen}>
                        Open
                    </Button>
                </div>
            )}

            <ul className="mb-4 grid flex-1 grid-cols-7 gap-x-2">
                {weekDays.map((weekDay) => (
                    <li key={weekDay}>
                        <WeekDay weekDay={weekDay} />
                    </li>
                ))}
            </ul>

            <section className="flex h-full w-full flex-col">
                <ul className="grid flex-1 grid-cols-7 [grid-template-rows:repeat(6,1fr)] gap-x-2 gap-y-2">
                    {days.map((dpDay) => {
                        const day = Number(dpDay.day);
                        const pnl = new Decimal(monthData?.daily[day]?.pnl ?? 0);
                        const numberOfPositions = monthData?.daily[day]?.positions_count ?? 0;

                        return (
                            <li key={dpDay.$date.toDateString()} className="h-full w-full">
                                <Day
                                    dpDay={dpDay}
                                    pnl={pnl}
                                    numberOfPositions={numberOfPositions}
                                    shrinkedView={shrink}
                                />
                            </li>
                        );
                    })}
                </ul>
            </section>
        </section>
    );
}

interface DayProps {
    dpDay: DPDay;
    pnl: Decimal;
    numberOfPositions: number;
    shrinkedView?: boolean;
}

function Day(props: DayProps) {
    const { dpDay, pnl, numberOfPositions, shrinkedView } = props;

    const isWin = dpDay.inCurrentMonth && pnl.isPositive();
    const isLoss = dpDay.inCurrentMonth && pnl.isNegative();
    const isNoTradeDay = dpDay.inCurrentMonth && pnl.isZero() && numberOfPositions === 0;

    const [open, setOpen] = useState(false);
    const { data, isFetching } = apiHooks.position.useSearch(
        {
            filters: {
                trade_time: {
                    from: dpDay.$date,
                    to: dpDay.$date,
                },
            },
        },
        {
            enabled: open,
        }
    );

    return (
        <ListPositionsModal
            renderTrigger={() => (
                <button
                    className={cn("h-full w-full enabled:hover:brightness-110")}
                    disabled={isNoTradeDay || !dpDay.inCurrentMonth}
                >
                    <div
                        className={cn(
                            "border-border-subtle relative flex h-full flex-col items-start justify-between rounded-md border p-2",
                            {
                                "bg-success-border border-success-border": isWin,
                                "bg-error-border border-error-border": isLoss,
                                "bg-surface-2 border-none": isNoTradeDay,
                            }
                        )}
                    >
                        <span
                            className={cn({
                                "text-text-muted": !dpDay.inCurrentMonth,
                                "flex-center h-full w-full": shrinkedView,
                            })}
                        >
                            {dpDay.day}
                        </span>

                        {dpDay.inCurrentMonth && !shrinkedView && (
                            <div className="flex flex-col">
                                {!isNoTradeDay && (
                                    <PnL value={pnl} className="absolute-center text-lg font-medium">
                                        {formatCurrency(pnl.toString(), {
                                            compact: true,
                                        })}
                                    </PnL>
                                )}

                                {numberOfPositions > 0 && <span>{numberOfPositions} positions</span>}
                            </div>
                        )}
                    </div>
                </button>
            )}
            open={open}
            setOpen={setOpen}
            isLoading={isFetching}
            data={data?.data}
            title="Day info"
            description={`Positions on ${formatDate(dpDay.$date)}`}
        />
    );
}

interface WeekDayProps {
    weekDay: string;
}

function WeekDay(props: WeekDayProps) {
    const { weekDay } = props;

    return <div className="border-border-subtle flex-center rounded-md border p-2 font-medium">{weekDay}</div>;
}

interface PnLTileProps {
    title: string;
    pnl: Decimal;
    noOfPositions: number;
    onClick?: () => void;
    disabled?: boolean; // <-- add disabled prop
}

function PnLTile(props: PnLTileProps) {
    const { title, pnl, noOfPositions, onClick, disabled } = props;

    const isWin = pnl.isPositive();
    const isLoss = pnl.isNegative();

    return (
        <button
            className={cn(
                "border-border-subtle relative flex h-full flex-col items-start justify-between rounded-md",
                "min-h-30 min-w-40 border p-2 enabled:hover:brightness-110",
                {
                    "bg-success-border border-success-border": isWin,
                    "bg-error-border border-error-border": isLoss,
                    "bg-surface-2 text-text-muted border-none": noOfPositions === 0 || disabled,
                    "cursor-not-allowed opacity-60": disabled,
                }
            )}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span>{title}</span>

            <div className="flex flex-col">
                <PnL value={pnl} className="absolute-center text-lg font-medium">
                    {formatCurrency(pnl.toString(), {
                        compact: true,
                    })}
                </PnL>

                <span>{noOfPositions} positions</span>
            </div>
        </button>
    );
}
