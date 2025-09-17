import { useMemo, useState } from "react";
import { DPDay, useDatePicker } from "@rehookify/datepicker";
import Decimal from "decimal.js";

import { Button, cn, formatCurrency, formatDate, IconChevronLeft, IconChevronRight, Separator } from "netra";
import { GetCalendarResponse } from "@/lib/api/calendar";
import { PnL } from "@/components/pnl";
import { ListPositionsModal } from "@/components/list_positions_modal";
import { apiHooks } from "@/hooks/api_hooks";

interface TradingCalendarProps {
    data: GetCalendarResponse;
}

export function TradingCalendar(props: TradingCalendarProps) {
    const { data } = props;

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

    const { year, month, days } = calendars[0];

    const monthData = useMemo(() => data.monthly[`${month}_${year}`], [data, month, year]);

    return (
        <section className="flex h-full w-full flex-col">
            {selectedDates.length > 0 ? <h1>{selectedDates[0].toDateString()}</h1> : null}

            <header className="mb-2">
                <div className="flex flex-col gap-x-8 gap-y-2 sm:flex-row">
                    <div className="flex w-full items-center justify-between sm:w-[220px]!">
                        <Button variant="ghost" size="icon" {...subtractOffset({ months: 1 })}>
                            <IconChevronLeft size={18} />
                        </Button>

                        <p className="font-semibold">
                            {month} {year}
                        </p>

                        <Button variant="ghost" size="icon" {...addOffset({ months: 1 })}>
                            <IconChevronRight size={18} />
                        </Button>
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

                <Separator className="mt-2 mb-4" />

                <ul className="grid flex-1 grid-cols-7 gap-x-2 gap-y-2">
                    {weekDays.map((weekDay) => (
                        <li key={`${month}-${weekDay}`}>
                            <WeekDay weekDay={weekDay} />
                        </li>
                    ))}
                </ul>
            </header>

            <ul className="grid flex-1 grid-cols-7 [grid-template-rows:repeat(6,1fr)] gap-x-2 gap-y-2">
                {days.map((dpDay) => {
                    const day = Number(dpDay.day);
                    const pnl = new Decimal(monthData?.daily[day]?.pnl ?? 0);
                    const numberOfPositions = monthData?.daily[day]?.positions_count ?? 0;

                    return (
                        <li key={dpDay.$date.toDateString()} className="h-full w-full">
                            <Day dpDay={dpDay} pnl={pnl} numberOfPositions={numberOfPositions} />
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

interface DayProps {
    dpDay: DPDay;
    pnl: Decimal;
    numberOfPositions: number;
}

function Day(props: DayProps) {
    const { dpDay, pnl, numberOfPositions } = props;

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
                            })}
                        >
                            {dpDay.day}
                        </span>

                        {dpDay.inCurrentMonth && (
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
