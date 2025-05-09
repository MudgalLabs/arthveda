import { FC, ReactElement, ReactNode, useState } from "react";
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
} from "@rehookify/datepicker";
import clsx from "clsx";

import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { Button } from "@/s8ly";

// CSS for range picker styles.
import "./calendar.css";

interface CalendarProps {
    mode: "single" | "range";
    onDatesChange(d: Date[]): void;
    selectedDates: Date[];
    offsetDate?: Date;
    onOffsetChange?(d: Date): void;
}

function Calendar({
    mode,
    selectedDates,
    onDatesChange,
    offsetDate,
    onOffsetChange,
}: CalendarProps): ReactElement {
    const isRange = mode === "range";

    const config: DPUserConfig = {
        selectedDates,
        onDatesChange,
        offsetDate,
        onOffsetChange,
        dates: {
            mode,
            minDate: isRange
                ? selectedDates.length > 0
                    ? selectedDates[0]
                    : undefined
                : undefined,
            maxDate: new Date(),
            toggle: true,
        },
        calendar: {
            offsets: isRange ? [1] : undefined,
        },
        locale: {
            monthName: "short",
        },
    };

    return (
        <DatePickerStateProvider config={config}>
            <CalendarInternal />
        </DatePickerStateProvider>
    );
}

enum View {
    Days = "Days",
    Months = "Months",
    Years = "Years",
}

function CalendarInternal(): ReactElement {
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
                {calendar.days.map((d) => (
                    <Button
                        variant="ghost"
                        size="icon"
                        key={d.$date.toString()}
                        className={getDayClassName("text-xs", d)}
                        {...dayButton(d)}
                    >
                        {d.day}
                    </Button>
                ))}
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
            <div className="bg-muted border-border flex h-[330px] w-[300px] gap-x-4 rounded-md border-1 p-3">
                {view === View.Years ? (
                    <YearsView />
                ) : view === View.Months ? (
                    <MonthsView year={calendars[0].month} />
                ) : (
                    <DaysView calendar={calendars[0]} showNext showPrev />
                )}
            </div>
        </>
    );
}

interface CalendarGridProps {
    className?: string;
    children?: ReactNode;
}

export const CalendarGrid: FC<CalendarGridProps> = ({
    className,
    children,
}) => {
    const mainClassName = clsx("grid grid-cols-7 gap-x-0 gap-y-0", className);
    return <main className={mainClassName}>{children}</main>;
};

interface SectionHeaderProps {
    className?: string;
    children?: ReactNode;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
    className,
    children,
}) => {
    const headerClassName = clsx(
        "grid grid-cols-[2rem_1fr_2rem] items-center mb-2",
        className
    );
    return <header className={headerClassName}>{children}</header>;
};

interface SectionProps {
    className?: string;
    children?: ReactNode;
}

export const Section: FC<SectionProps> = ({ className, children }) => {
    const sectionClassName = clsx("", className);
    return <section className={sectionClassName}>{children}</section>;
};

export const getDayClassName = (
    className: string,
    { selected, disabled, inCurrentMonth, now, range }: DPDay
) =>
    clsx("day", className, range, {
        "bg-primary text-foreground hover:bg-accent opacity-100!": selected,
        "opacity-25 cursor-not-allowed": disabled,
        "text-foreground-muted": !inCurrentMonth && !selected,
        "bg-muted! text-foreground-muted!": !inCurrentMonth && !!range,
        "border border-accent": now,
    });

export const getMonthClassName = (
    className: string,
    { selected, now, disabled }: DPMonth
) =>
    clsx(className, {
        "bg-primary text-foreground hover:bg-accent opacity-100": selected,
        "border border-accent": now,
        "opacity-25 cursor-not-allowed": disabled,
    });

export const getYearsClassName = (
    className: string,
    { selected, now, disabled }: DPYear
) =>
    clsx(className, {
        "bg-primary text-foreground hover:bg-accent opacity-100": selected,
        "border border-accent": now,
        "opacity-25 cursor-not-allowed": disabled,
    });

export { Calendar };
export type { CalendarProps };
