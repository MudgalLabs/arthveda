import { FC, ReactNode, useState } from "react";
import { useDatePicker, DPDay, DPMonth, DPYear } from "@rehookify/datepicker";
import clsx from "clsx";

import { Button } from "@/s8ly";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

interface CalendarProps {}

enum View {
    Days = "Days",
    Months = "Months",
    Years = "Years",
}

function Calendar() {
    const [selectedDates, onDatesChange] = useState<Date[]>([]);
    const [view, setView] = useState<View>(View.Days);

    const {
        data: { calendars, weekDays, formattedDates, months, years },
        propGetters: {
            dayButton,
            addOffset,
            subtractOffset,
            monthButton,
            nextYearsButton,
            previousYearsButton,
            yearButton,
        },
    } = useDatePicker({
        selectedDates,
        onDatesChange,
        calendar: {
            startDay: 1,
        },
        locale: {
            monthName: "short",
        },
    });

    const { month, year, days } = calendars[0];

    const DaysView = (
        <Section>
            <SectionHeader>
                <Button
                    variant="ghost"
                    size="icon"
                    {...subtractOffset({ months: 1 })}
                >
                    <IconChevronLeft />
                </Button>
                <span className="text-foreground flex-center gap-x-2">
                    <Button
                        variant="link"
                        className="text-foreground p-0 font-normal"
                        onClick={() => setView(View.Months)}
                    >
                        {month}
                    </Button>
                    <Button
                        variant="link"
                        className="text-foreground p-0 font-normal"
                        onClick={() => setView(View.Years)}
                    >
                        {year}
                    </Button>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    {...addOffset({ months: 1 })}
                >
                    <IconChevronRight />
                </Button>
            </SectionHeader>

            <CalendarInternal className="mb-2 h-8 items-center">
                {weekDays.map((d) => (
                    <p
                        key={d}
                        className="text-foreground-muted text-center text-xs"
                    >
                        {d}
                    </p>
                ))}
            </CalendarInternal>

            <CalendarInternal>
                {days.map((d) => (
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
            </CalendarInternal>
        </Section>
    );

    const MonthsView = (
        <Section>
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

            <main className="mt-5 grid h-full grid-cols-3 items-center gap-x-2 gap-y-5">
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

    const YearsView = (
        <Section>
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
            <main className="mt-5 grid h-full grid-cols-3 items-center gap-x-2 gap-y-5">
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
    const content = () => {
        if (view === View.Years) return YearsView;
        else if (view === View.Months) return MonthsView;
        return DaysView;
    };

    return (
        <>
            {formattedDates[0]}
            <main className="bg-muted border-border h-[350px] w-[310px] rounded-md border-1 p-3">
                {content()}
            </main>
        </>
    );
}

interface CalendarProps {
    className?: string;
    children?: ReactNode;
}

export const CalendarInternal: FC<CalendarProps> = ({
    className,
    children,
}) => {
    const mainClassName = clsx("grid grid-cols-7 gap-x-1 gap-y-1", className);
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
    { selected, disabled, inCurrentMonth, now }: DPDay
) =>
    clsx(className, {
        "bg-primary text-foreground hover:bg-accent opacity-100!": selected,
        "opacity-25 cursor-not-allowed": disabled,
        "text-foreground-muted": !inCurrentMonth && !selected,
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
