import {
    FC,
    ReactElement,
    ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import {
    DPDay,
    DPMonth,
    DPYear,
    DatePickerStateProvider,
    DPCalendar,
    useDatePickerStateContext,
    useMonths,
    useYears,
    DPUserConfig,
    useMonthsPropGetters,
    useYearsPropGetters,
    useDaysPropGetters,
    useDatePickerOffsetPropGetters,
    useCalendars,
    DPTime,
    useTime,
    useTimePropGetter,
} from "@rehookify/datepicker";

import { cn, deepMerge } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { Button } from "@/s8ly";

// CSS for range picker styles.
import "./calendar.css";

interface CalendarProps {
    dates: Date[];
    onDatesChange(d: Date[]): void;
    mode?: "single" | "range";
    offsetDate?: Date;
    onOffsetChange?(d: Date): void;
    /** If set to `true`, user will be able to pick a time as well. */
    time?: boolean;
    config?: Omit<DPUserConfig, "selectedDates" | "onDatesChange">;
}

function Calendar({
    dates: selectedDates,
    onDatesChange,
    mode = "single",
    offsetDate,
    onOffsetChange,
    time = false,
    config: configProp,
}: CalendarProps): ReactElement {
    const isRange = mode === "range";

    let config: DPUserConfig = {
        selectedDates,
        onDatesChange,
        offsetDate,
        onOffsetChange,
        dates: {
            mode,
        },
        calendar: {
            offsets: isRange ? [1] : undefined,
        },
        time: { interval: 15 },
        locale: {
            monthName: "short",
            hour: "2-digit",
            minute: "2-digit",
        },
    };

    if (configProp) {
        config = deepMerge(config, configProp);
    }

    return (
        <DatePickerStateProvider config={config}>
            <div
                className={cn("grid grid-cols-[repeat(2,_min-content)]", {
                    "gap-x-6": time,
                })}
            >
                <CalendarInternal time={time} />

                {time && (
                    <div className="border-border block rounded border p-4">
                        <Time />
                    </div>
                )}
            </div>
        </DatePickerStateProvider>
    );
}

const enum View {
    Days = "Days",
    Months = "Months",
    Years = "Years",
}

function CalendarInternal({ time = false }: { time?: boolean }): ReactElement {
    const [view, setView] = useState<View>(View.Days);

    const state = useDatePickerStateContext();
    const { monthButton } = useMonthsPropGetters(state);
    const { nextYearsButton, previousYearsButton, yearButton } =
        useYearsPropGetters(state);
    const { dayButton } = useDaysPropGetters(state);
    const { addOffset, subtractOffset } = useDatePickerOffsetPropGetters(state);

    const { months } = useMonths(state);
    const { years } = useYears(state);
    const { calendars, weekDays } = useCalendars(state);

    const isRange = state.config.dates.mode === "range";

    // This ref and the useEffect attached to this ref is because the library
    // (@rehookify/datepicker) being used to build Calendar and Time components
    // "activates" or "shows" the selected/active time only when the user
    // clicks on the selected date. The correct behaviour would have been to
    // mark the "active"/"selected" time for the active date automatically on
    // mount but it doesn't. So I am programmatically clicking on the active
    // day button (if any) so that the time also gets active and render appropriately.
    const activeDayRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (!time) return;

        const days = calendars[0].days;
        let day;
        for (let i = 0; i < days.length; i += 1) {
            const d = days[i];

            if (d.selected) {
                day = d;
                break;
            }
        }

        if (day) {
            activeDayRef.current?.click();
        }
    }, []);

    const DaysView = ({
        calendar,
        showNext,
        showPrev,
    }: {
        calendar: DPCalendar;
        showPrev: boolean;
        showNext: boolean;
    }) => (
        <Section>
            <SectionHeader>
                {showPrev ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        {...subtractOffset({ months: 1 })}
                    >
                        <IconChevronLeft />
                    </Button>
                ) : (
                    <div />
                )}

                <span className="text-foreground flex-center gap-x-2">
                    <Button
                        variant="link"
                        className="text-foreground p-0 font-normal"
                        onClick={() => setView(View.Months)}
                    >
                        {calendar.month}
                    </Button>
                    <Button
                        variant="link"
                        className="text-foreground p-0 font-normal"
                        onClick={() => setView(View.Years)}
                    >
                        {calendar.year}
                    </Button>
                </span>

                {showNext ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        {...addOffset({ months: 1 })}
                    >
                        <IconChevronRight />
                    </Button>
                ) : (
                    <div />
                )}
            </SectionHeader>

            <CalendarGrid className="mb-2 h-8 items-center">
                {weekDays.map((d) => (
                    <p
                        key={d}
                        className="text-foreground-muted text-center text-xs"
                    >
                        {d}
                    </p>
                ))}
            </CalendarGrid>

            <CalendarGrid>
                {calendar.days.map((d) => {
                    return (
                        <Button
                            ref={d.selected && !isRange ? activeDayRef : null}
                            variant="ghost"
                            size="icon"
                            key={d.$date.toString()}
                            className={getDayClassName(
                                "text-foreground text-xs",
                                d
                            )}
                            {...dayButton(d)}
                        >
                            {d.day}
                        </Button>
                    );
                })}
            </CalendarGrid>
        </Section>
    );

    const MonthsView = ({ year }: { year: string }) => (
        <Section className="h-full w-full">
            <SectionHeader>
                <Button
                    variant="ghost"
                    size="icon"
                    {...subtractOffset({ months: 1 })}
                >
                    <IconChevronLeft />
                </Button>
                <Button
                    variant="link"
                    className="text-foreground p-0 font-normal"
                    onClick={() => setView(View.Years)}
                >
                    {year}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    {...addOffset({ months: 1 })}
                >
                    <IconChevronRight />
                </Button>
            </SectionHeader>

            <main className="mt-5 grid grid-cols-3 items-center gap-x-2 gap-y-5">
                {months.map((m) => (
                    <Button
                        variant="ghost"
                        key={m.month + year}
                        className={getMonthClassName("text-xs", m)}
                        {...monthButton(m, {
                            onClick: () => setView(View.Days),
                        })}
                    >
                        {m.month}
                    </Button>
                ))}
            </main>
        </Section>
    );

    const YearsView = () => (
        <Section className="h-full w-full">
            <SectionHeader>
                <Button variant="ghost" size="icon" {...previousYearsButton()}>
                    <IconChevronLeft />
                </Button>
                <p className="text-center text-sm">
                    {`${years[0].year} - ${years[years.length - 1].year}`}
                </p>
                <Button variant="ghost" size="icon" {...nextYearsButton()}>
                    <IconChevronRight />
                </Button>
            </SectionHeader>
            <main className="mt-5 grid grid-cols-3 items-center gap-x-2 gap-y-5">
                {years.map((y) => (
                    <Button
                        variant="ghost"
                        key={y.$date.toString()}
                        className={getYearsClassName("text-xs", y)}
                        {...yearButton(y, {
                            onClick: () => setView(View.Months),
                        })}
                    >
                        {y.year}
                    </Button>
                ))}
            </main>
        </Section>
    );

    return (
        <>
            <div
                className={cn(
                    "bg-muted border-border flex h-[330px] w-fit gap-x-4 rounded-md border-1 p-3",
                    {
                        "w-[280px]": !isRange,
                        "w-[560px]": isRange,
                    }
                )}
            >
                {view === View.Years ? (
                    <YearsView />
                ) : view === View.Months ? (
                    <MonthsView year={calendars[0].month} />
                ) : (
                    <div className="flex w-full items-center justify-between">
                        {calendars.map((calendar, idx) => (
                            <DaysView
                                key={calendar.month + calendar.year + idx}
                                calendar={calendar}
                                showNext={calendars.length === 1 || idx == 1}
                                showPrev={calendars.length === 1 || idx == 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function Time() {
    const state = useDatePickerStateContext();
    const time = useTime(state);
    const { timeButton } = useTimePropGetter(state);

    // This ref and the useLayoutEffect attached to it allow us to bring the
    // active/selected time in the view of the scrollable <ul>.
    const activeTimeRef = useRef<HTMLButtonElement | null>(null);
    useLayoutEffect(() => {
        if (activeTimeRef.current) {
            activeTimeRef.current.scrollIntoView({
                behavior: "instant",
                block: "center",
            });
        }
    }, [time]);

    return (
        <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
            {time.time.map((t) => {
                return (
                    <li key={t.$date.toString()} className="p-0">
                        <Button
                            ref={t.selected ? activeTimeRef : null}
                            variant="ghost"
                            className={getTimesClassName(
                                "px-8 font-mono text-xs",
                                t
                            )}
                            {...timeButton(t)}
                        >
                            {t.time}
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
}

interface CalendarGridProps {
    className?: string;
    children?: ReactNode;
}

const CalendarGrid: FC<CalendarGridProps> = ({ className, children }) => {
    const mainClassName = cn("grid grid-cols-7 gap-x-0 gap-y-0", className);
    return <main className={mainClassName}>{children}</main>;
};

interface SectionHeaderProps {
    className?: string;
    children?: ReactNode;
}

const SectionHeader: FC<SectionHeaderProps> = ({ className, children }) => {
    const headerClassName = cn(
        "grid grid-cols-[2rem_1fr_2rem] items-center mb-2",
        className
    );
    return <header className={headerClassName}>{children}</header>;
};

interface SectionProps {
    className?: string;
    children?: ReactNode;
}

const Section: FC<SectionProps> = ({ className, children }) => {
    const sectionClassName = cn("", className);
    return <section className={sectionClassName}>{children}</section>;
};

const getDayClassName = (
    className: string,
    { selected, disabled, inCurrentMonth, now, range }: DPDay
) =>
    cn("day", className, range, {
        "bg-primary text-foreground hover:bg-primary/90! opacity-100!":
            selected,
        "opacity-25 cursor-not-allowed": disabled,
        "text-foreground-muted": !inCurrentMonth && !selected,
        "bg-muted! text-foreground-muted!": !inCurrentMonth && !!range,
        "border border-accent rounded-md!": now, // The `!` on rounded-md exists because without it, the "range" classes remove it.
    });

const getMonthClassName = (
    className: string,
    { selected, now, disabled }: DPMonth
) =>
    cn(className, {
        "bg-primary text-foreground hover:bg-accent opacity-100": selected,
        "border border-accent": now,
        "opacity-25 cursor-not-allowed": disabled,
    });

const getYearsClassName = (
    className: string,
    { selected, now, disabled }: DPYear
) =>
    cn(className, {
        "bg-primary text-foreground hover:bg-accent opacity-100": selected,
        "border border-accent": now,
        "opacity-25 cursor-not-allowed": disabled,
    });

const getTimesClassName = (className: string, { selected, disabled }: DPTime) =>
    cn(className, {
        "bg-primary text-foreground hover:bg-primary/90! opacity-100!":
            selected,
        "opacity-25 cursor-not-allowed": disabled,
    });

export { Calendar, Time, CalendarInternal };
export type { CalendarProps };
