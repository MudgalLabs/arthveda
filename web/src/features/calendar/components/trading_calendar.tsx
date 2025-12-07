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

    const isAllView = viewMode === ViewMode.ALL;
    const isYearlyView = viewMode === ViewMode.YEARLY;
    const isMonthlyView = viewMode === ViewMode.MONTHLY;

    const { days, year, month } = calendars[0];

    const yearlyData = useMemo(() => {
        return data[Number(year)];
    }, [data, year]);

    const monthData = useMemo(() => {
        return data[Number(year)]?.monthly[month];
    }, [data, month, year]);

    // Disable going to next month if it's the current month or there is no data for next month in current year.
    const disableNextMonth = Number(year) === now.getFullYear() && MONTHS.indexOf(month) === now.getMonth();
    // Disable going to previous month if there is no data for previous year and current month is January.
    const disablePrevMonth = !data.hasOwnProperty(Number(year) - 1) && month === "January";
    // Disable going to next year if there is no data for next year.
    const disableNextYear = !data.hasOwnProperty(Number(year) + 1);
    // Disable going to previous year if there is no data for previous year.
    const disablePrevYear = !data.hasOwnProperty(Number(year) - 1);

    const content = useMemo(() => {
        if (isAllView) {
            return (
                <ul className="mb-8 flex w-full flex-wrap justify-center gap-4 sm:justify-start!">
                    {Object.keys(data).map((year) => {
                        const yearData = data[Number(year)];
                        const isFuture = Number(year) > now.getFullYear();

                        return (
                            <li key={year}>
                                <PnLTile
                                    title={year}
                                    pnl={new Decimal(yearData?.pnl ?? 0)}
                                    noOfPositions={yearData?.positions_count ?? 0}
                                    onClick={() => {
                                        setViewMode(ViewMode.YEARLY);
                                        onOffsetChange(new Date(Number(year), now.getMonth(), now.getDate()));
                                    }}
                                    disabled={isFuture}
                                />
                            </li>
                        );
                    })}
                </ul>
            );
        }

        if (isYearlyView) {
            return (
                <ul className="mb-8 flex w-full flex-wrap justify-center gap-4 sm:justify-start!">
                    {MONTHS.map((month, idx) => {
                        const monthData = data[Number(year)]?.monthly[month];
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

        if (isMonthlyView) {
            return <MonthlyCalendar data={data} shrink={shrinkedView} offsetDate={offsetDate} />;
        }

        return null;
    }, [
        days,
        monthData,
        weekDays,
        shrinkedView,
        viewMode,
        isMonthlyView,
        isYearlyView,
        data,
        setViewMode,
        year,
        now,
        onDatesChange,
        offsetDate,
        year,
        now,
        onOffsetChange,
        setViewMode,
    ]);

    return (
        <div className="flex h-full w-full flex-col">
            <div className="mb-2">
                {!isAllView ? (
                    <div
                        className={cn("flex flex-col gap-x-8 gap-y-2", {
                            "sm:flex-row": !shrinkedView,
                        })}
                    >
                        <div
                            className={cn("flex w-full items-center justify-between", {
                                "sm:w-[220px]!": !shrinkedView,
                            })}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                {...subtractOffset(isMonthlyView ? { months: 1 } : { years: 1 })}
                                disabled={isMonthlyView ? disablePrevMonth : disablePrevYear}
                            >
                                <IconChevronLeft size={18} />
                            </Button>

                            <span className="space-x-2">
                                {isMonthlyView && (
                                    <Button variant="link" onClick={() => setViewMode(ViewMode.YEARLY)}>
                                        {month}
                                    </Button>
                                )}

                                <Button variant="link" onClick={() => setViewMode(ViewMode.ALL)}>
                                    {year}
                                </Button>
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                {...addOffset(isMonthlyView ? { months: 1 } : { years: 1 })}
                                disabled={isMonthlyView ? disableNextMonth : disableNextYear}
                            >
                                <IconChevronRight size={18} />
                            </Button>
                        </div>

                        <div className="flex-center sm:flex-x gap-x-4!">
                            {isMonthlyView ? (
                                <>
                                    {monthData?.pnl && (
                                        <PnL value={new Decimal(monthData.pnl)} className="text-xl font-semibold">
                                            {formatCurrency(monthData.pnl)}
                                        </PnL>
                                    )}

                                    {monthData?.positions_count && (
                                        <p className="text-text-muted">{monthData.positions_count} positions</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {yearlyData?.pnl && (
                                        <PnL value={new Decimal(yearlyData.pnl)} className="text-xl font-semibold">
                                            {formatCurrency(yearlyData.pnl)}
                                        </PnL>
                                    )}

                                    {yearlyData?.positions_count && (
                                        <p className="text-text-muted">{yearlyData.positions_count} positions</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="flex-center w-full">Select a year</p>
                )}

                <Separator className="my-4" />
            </div>

            {content}
        </div>
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
        return data[Number(year)]?.monthly[month];
    }, [data, month, year]);

    // Group days into weeks (arrays of 7 days)
    const weeks: DPDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    // Use backend weekly stats, week-of-month index (starting from 1)
    const weeklyStats = weeks.map((_, weekIdx) => {
        const weekNumber = weekIdx + 1;
        const weekly = monthData?.weekly?.[weekNumber];
        if (!weekly) return { pnl: new Decimal(0), totalPositions: 0 };
        return { pnl: new Decimal(weekly.pnl), totalPositions: weekly.positions_count };
    });

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

            {/* Weekday header row */}
            <ul
                className={cn("mb-4 grid w-full min-w-0 flex-1 gap-x-2", {
                    "grid-cols-8": !shrink,
                    "grid-cols-7": shrink,
                })}
            >
                {weekDays.map((weekDay) => (
                    <li key={weekDay} className="w-full min-w-0">
                        <WeekDay weekDay={weekDay} />
                    </li>
                ))}
                {!shrink && (
                    <li className="w-full min-w-0">
                        <div className="border-border-subtle flex-center rounded-md border p-2 font-medium">Weekly</div>
                    </li>
                )}
            </ul>

            <section className="flex h-full w-full flex-col">
                <ul
                    className={cn("grid w-full min-w-0 flex-1 gap-x-2 gap-y-2", {
                        "grid-cols-8 [grid-template-rows:repeat(6,1fr)]": !shrink,
                        "grid-cols-7 [grid-template-rows:repeat(6,1fr)]": shrink,
                    })}
                >
                    {weeks.map((week, weekIdx) => (
                        <>
                            {week.map((dpDay) => {
                                const day = Number(dpDay.day);
                                const pnl = new Decimal(monthData?.daily[day]?.pnl ?? 0);
                                const numberOfPositions = monthData?.daily[day]?.positions_count ?? 0;

                                return (
                                    <li key={dpDay.$date.toDateString()} className="h-full w-full min-w-0">
                                        <Day
                                            dpDay={dpDay}
                                            pnl={pnl}
                                            numberOfPositions={numberOfPositions}
                                            shrinkedView={shrink}
                                        />
                                    </li>
                                );
                            })}
                            {/* Fill empty cells if week has less than 7 days */}
                            {Array.from({ length: 7 - week.length }).map((_, idx) => (
                                <li key={`empty-${weekIdx}-${idx}`} className="h-full w-full min-w-0" />
                            ))}
                            {/* Weekly performance cell, only if not shrinked */}
                            {!shrink && (
                                <li key={`weekly-${weekIdx}`} className="h-full w-full min-w-0">
                                    <WeeklyPerformanceTile
                                        weekNumber={weekIdx + 1}
                                        pnl={weeklyStats[weekIdx].pnl}
                                        totalPositions={weeklyStats[weekIdx].totalPositions}
                                    />
                                </li>
                            )}
                        </>
                    ))}
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
                "min-h-[120px] w-full min-w-[180px] border p-2 enabled:hover:brightness-110",
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

interface WeeklyPerformanceTileProps {
    weekNumber: number;
    pnl: Decimal;
    totalPositions: number;
}

function WeeklyPerformanceTile(props: WeeklyPerformanceTileProps) {
    const { weekNumber, pnl, totalPositions } = props;
    const isWin = pnl.isPositive();
    const isLoss = pnl.isNegative();

    return (
        <div
            className={cn(
                "border-border-subtle relative flex h-full flex-col items-start justify-between rounded-md",
                "w-full min-w-0 border p-2 py-3",
                {
                    "bg-success-border border-success-border": isWin,
                    "bg-error-border border-error-border": isLoss,
                    "bg-surface-2 text-text-muted border-none": totalPositions === 0,
                }
            )}
        >
            <span className="mb-1 font-semibold">Week {weekNumber}</span>
            {totalPositions > 0 && (
                <div className="flex w-full flex-col">
                    <PnL value={pnl} className="absolute-center text-lg font-bold">
                        {formatCurrency(pnl.toString(), { compact: false })}
                    </PnL>

                    <span className="absolute bottom-2 left-2 text-xs">{totalPositions} positions</span>
                </div>
            )}
        </div>
    );
}
