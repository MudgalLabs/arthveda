import { Fragment, useMemo, useState } from "react";
import { DPDay, useDatePicker } from "@rehookify/datepicker";
import Decimal from "decimal.js";
import { Button, cn, formatCurrency, IconChevronLeft, IconChevronRight, Separator, useControlled } from "netra";

import { GetCalendarAllResponse } from "@/lib/api/calendar";
import { PnL } from "@/components/pnl";
import { apiHooks } from "@/hooks/api_hooks";
import { CalendarDayInfoModal } from "@/features/calendar/components/calendar_day_info_modal";
import { CalendarPerfViewMode } from "@/features/calendar/components/calendar_perf_view_select";

const enum CalendarViewMode {
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
    data: GetCalendarAllResponse;
    perfViewMode: CalendarPerfViewMode;
    shrinkedView?: boolean;
}

export function TradingCalendar(props: TradingCalendarProps) {
    const { data, shrinkedView = false, perfViewMode } = props;

    const now = new Date();

    const [viewMode, setViewMode] = useState<CalendarViewMode>(CalendarViewMode.MONTHLY);

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

    const isAllView = viewMode === CalendarViewMode.ALL;
    const isYearlyView = viewMode === CalendarViewMode.YEARLY;
    const isMonthlyView = viewMode === CalendarViewMode.MONTHLY;

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
                                    pnl={new Decimal(yearData?.[perfViewMode] ?? 0)}
                                    perfViewMode={perfViewMode}
                                    positionsCount={yearData?.positions_count ?? 0}
                                    onClick={() => {
                                        setViewMode(CalendarViewMode.YEARLY);
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
                                    pnl={new Decimal(monthData?.[perfViewMode] ?? 0)}
                                    perfViewMode={perfViewMode}
                                    positionsCount={monthData?.positions_count ?? 0}
                                    onClick={() => {
                                        setViewMode(CalendarViewMode.MONTHLY);
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
            return (
                <MonthlyCalendar
                    data={data}
                    perfViewMode={perfViewMode}
                    shrink={shrinkedView}
                    offsetDate={offsetDate}
                />
            );
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
                                    <Button variant="link" onClick={() => setViewMode(CalendarViewMode.YEARLY)}>
                                        {month}
                                    </Button>
                                )}

                                <Button variant="link" onClick={() => setViewMode(CalendarViewMode.ALL)}>
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
                                    {monthData?.[perfViewMode] && (
                                        <PnL
                                            value={new Decimal(monthData[perfViewMode])}
                                            className="text-xl font-semibold"
                                        >
                                            {perfViewMode !== CalendarPerfViewMode.GROSS_R_FACTOR
                                                ? formatCurrency(monthData[perfViewMode])
                                                : new Decimal(monthData[perfViewMode]).toFixed(2)}
                                        </PnL>
                                    )}

                                    {monthData?.positions_count && (
                                        <p className="text-text-muted">{monthData.positions_count} positions</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {yearlyData?.[perfViewMode] && (
                                        <PnL
                                            value={new Decimal(yearlyData[perfViewMode])}
                                            className="text-xl font-semibold"
                                        >
                                            {perfViewMode !== CalendarPerfViewMode.GROSS_R_FACTOR
                                                ? formatCurrency(yearlyData[perfViewMode])
                                                : new Decimal(yearlyData[perfViewMode]).toFixed(2)}
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
    data: GetCalendarAllResponse;
    perfViewMode: CalendarPerfViewMode;
    offsetDate?: Date;
    shrink?: boolean;
    onClickOpen?: () => void;
}

function MonthlyCalendar(props: MonthlyCalendarProps) {
    const { data, perfViewMode, shrink, offsetDate: offsetDateProp, onClickOpen } = props;

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

    const weeks: DPDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const weeklyStats = weeks.map((_, weekIdx) => {
        const weekNumber = weekIdx + 1;
        const weekly = monthData?.weekly?.[weekNumber];
        if (!weekly)
            return {
                net_pnl: new Decimal(0),
                gross_pnl: new Decimal(0),
                gross_r_factor: new Decimal(0),
                totalPositions: 0,
            };
        return {
            net_pnl: new Decimal(weekly.net_pnl),
            gross_pnl: new Decimal(weekly.gross_pnl),
            gross_r_factor: new Decimal(weekly.gross_r_factor),
            totalPositions: weekly.positions_count,
        };
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
                        <Fragment key={weekIdx}>
                            {week.map((dpDay) => {
                                const day = Number(dpDay.day);
                                const pnl = new Decimal(monthData?.daily[day]?.[perfViewMode] ?? 0);
                                const numberOfPositions = monthData?.daily[day]?.positions_count ?? 0;

                                return (
                                    <li key={dpDay.$date.toDateString()} className="h-full w-full min-w-0">
                                        <Day
                                            dpDay={dpDay}
                                            netPnL={pnl}
                                            positionsCount={numberOfPositions}
                                            perfViewMode={perfViewMode}
                                            shrinkedView={shrink}
                                        />
                                    </li>
                                );
                            })}
                            {Array.from({ length: 7 - week.length }).map((_, idx) => (
                                <li key={`empty-${weekIdx}-${idx}`} className="h-full w-full min-w-0" />
                            ))}
                            {!shrink && (
                                <li key={`weekly-${weekIdx}`} className="h-full w-full min-w-0">
                                    <WeeklyPerformanceTile
                                        weekNumber={weekIdx + 1}
                                        pnl={weeklyStats[weekIdx][perfViewMode]}
                                        perfViewMode={perfViewMode}
                                        totalPositions={weeklyStats[weekIdx].totalPositions}
                                    />
                                </li>
                            )}
                        </Fragment>
                    ))}
                </ul>
            </section>
        </section>
    );
}

interface DayProps {
    dpDay: DPDay;
    netPnL: Decimal;
    positionsCount: number;
    perfViewMode: CalendarPerfViewMode;
    shrinkedView?: boolean;
}

function Day(props: DayProps) {
    const { dpDay, netPnL, positionsCount, perfViewMode, shrinkedView } = props;

    const isWin = dpDay.inCurrentMonth && netPnL.isPositive();
    const isLoss = dpDay.inCurrentMonth && netPnL.isNegative();
    const isNoTradeDay = dpDay.inCurrentMonth && netPnL.isZero() && positionsCount === 0;

    const [open, setOpen] = useState(false);
    const { data, isFetching } = apiHooks.calendar.useGetCalendarDay(dpDay.$date, {
        enabled: open,
    });

    return (
        <CalendarDayInfoModal
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
                            className={cn("font-semibold", {
                                "text-text-muted": !dpDay.inCurrentMonth,
                                "h-full w-full text-sm": shrinkedView,
                            })}
                        >
                            {dpDay.day}
                        </span>

                        {dpDay.inCurrentMonth && (
                            <div className="flex w-full justify-between">
                                {!isNoTradeDay && (
                                    <PnL
                                        value={netPnL}
                                        className={cn("absolute-center text-lg font-medium", {
                                            "text-xs": shrinkedView,
                                        })}
                                    >
                                        {perfViewMode !== CalendarPerfViewMode.GROSS_R_FACTOR
                                            ? formatCurrency(netPnL.toString(), {
                                                  compact: true,
                                                  hideSymbol: true,
                                              })
                                            : netPnL.toFixed(2)}
                                    </PnL>
                                )}

                                {positionsCount > 0 && !shrinkedView && (
                                    <span className="text-xs">{positionsCount} positions</span>
                                )}
                            </div>
                        )}
                    </div>
                </button>
            )}
            open={open}
            setOpen={setOpen}
            isLoading={isFetching}
            data={data}
            date={dpDay.$date}
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
    perfViewMode: CalendarPerfViewMode;
    positionsCount: number;
    onClick?: () => void;
    disabled?: boolean;
}

function PnLTile(props: PnLTileProps) {
    const { title, pnl, perfViewMode, positionsCount, onClick, disabled } = props;

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
                    "bg-surface-2 text-text-muted border-none": positionsCount === 0 || disabled,
                    "cursor-not-allowed opacity-60": disabled,
                }
            )}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span className="font-semibold">{title}</span>

            <div className="flex w-full justify-between">
                <PnL value={pnl} className="absolute-center text-lg font-bold">
                    {perfViewMode !== CalendarPerfViewMode.GROSS_R_FACTOR
                        ? formatCurrency(pnl.toString(), { compact: true })
                        : pnl.toFixed(2)}
                </PnL>

                <p className="text-xs">{positionsCount} positions</p>
            </div>
        </button>
    );
}

interface WeeklyPerformanceTileProps {
    weekNumber: number;
    pnl: Decimal;
    perfViewMode: CalendarPerfViewMode;
    totalPositions: number;
}

function WeeklyPerformanceTile(props: WeeklyPerformanceTileProps) {
    const { weekNumber, pnl, perfViewMode, totalPositions } = props;
    const isWin = pnl.isPositive();
    const isLoss = pnl.isNegative();

    return (
        <div
            className={cn(
                "border-border-subtle relative flex h-full flex-col items-start justify-between rounded-md",
                "w-full min-w-0 border p-2",
                {
                    "bg-success-border border-success-border": isWin,
                    "bg-error-border border-error-border": isLoss,
                    "bg-surface-2 text-text-muted border-none": totalPositions === 0,
                }
            )}
        >
            <span className="font-semibold">Week {weekNumber}</span>

            {totalPositions > 0 && (
                <div className="flex w-full justify-between">
                    <PnL value={pnl} className="absolute-center text-lg font-medium">
                        {perfViewMode !== CalendarPerfViewMode.GROSS_R_FACTOR
                            ? formatCurrency(pnl.toString(), { compact: true })
                            : pnl.toFixed(2)}
                    </PnL>

                    <p className="text-xs">{totalPositions} positions</p>
                </div>
            )}
        </div>
    );
}
