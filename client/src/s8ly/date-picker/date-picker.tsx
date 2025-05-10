import { ComponentProps, useState } from "react";

import { useControlled } from "@/hooks/use-controlled";
import { IconCalendarSingle } from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";
import {
    Calendar,
    CalendarProps,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/s8ly";

interface DatePickerProps extends CalendarProps {
    className?: string;
}

function DatePicker({
    dates: datesProp,
    onDatesChange: onDatesChangeProp,
    className,
    ...props
}: DatePickerProps) {
    const [dates, setDates] = useControlled({
        controlled: datesProp,
        default: [],
        name: "dates",
    });

    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <DatePickerButton
                    className={cn(
                        props.mode === "single" ? "w-[160px]" : "w-[270px]",
                        className
                    )}
                    open={open}
                    isDateSet={dates.length > 0}
                >
                    <IconCalendarSingle />
                    {dates.length > 0
                        ? dates.map((d) => formatDate(d)).join(" - ")
                        : "Pick a date"}
                </DatePickerButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-none p-0" align="start">
                <Calendar
                    dates={dates}
                    onDatesChange={onDatesChangeProp ?? setDates}
                    {...props}
                />
            </PopoverContent>
        </Popover>
    );
}

function DatePickerButton({
    children,
    className,
    open,
    isDateSet,
    ...props
}: ComponentProps<"button"> & { open: boolean; isDateSet: boolean }) {
    return (
        <button
            className={cn(
                "border-border text-foreground-muted bg-mutedj bg-muted flex h-10 items-center justify-start gap-x-2 rounded-md border-1 p-2 text-left text-sm font-normal enabled:hover:cursor-pointer",
                {
                    "bg-background-1 border-accent": open,
                    "text-foreground": isDateSet,
                },
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export { DatePicker };
export type { DatePickerProps };
