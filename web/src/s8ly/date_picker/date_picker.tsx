import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";

import { useControlled } from "@/hooks/use_controlled";
import { IconCalendarRange, IconCalendarSingle } from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";
import { Calendar, CalendarProps, Popover, PopoverContent, PopoverTrigger, PopoverContentProps } from "@/s8ly";

interface DatePickerProps extends Omit<CalendarProps, "dates" | "onDatesChange"> {
    popoverContentProps?: PopoverContentProps;
    container?: HTMLElement | null;
    className?: string;
    dates?: Date[];
    placeholder?: string;
    onDatesChange?(d: Date[]): void;
    onOpen?: () => void;
    onClose?: () => void;
}

function DatePicker({
    container,
    popoverContentProps = {},
    className,
    dates: datesProp,
    placeholder: placeholderProp,
    onDatesChange: onDatesChangeProp,
    offsetDate: offsetDateProp,
    mode,
    onOffsetChange: onOffsetChangeProp,
    time,
    onOpen,
    onClose,
    config,
}: DatePickerProps) {
    const [dates, setDates] = useControlled({
        controlled: datesProp,
        default: [],
        name: "dates",
    });

    const [offsetDate, setOffsetDate] = useControlled({
        controlled: offsetDateProp,
        default: useMemo(() => new Date(), []),
        name: "offsetDate",
    });

    const [open, setOpen] = useState(false);
    const prevOpen = useRef(open);

    const isDateSet = dates.length > 0;
    const isRange = mode === "range";
    const placeholder = placeholderProp || (isRange ? "Select range" : "Select date");
    const selectedText = dates.map((d) => formatDate(d, { time: time })).join(" - ");

    let width = "w-[150px]";
    if (isRange) width = "w-[260px]";
    if (time && !isRange) width = "w-[190px]";
    if (time && isRange) width = "w-[330px]";

    const { className: popoverContentClassname, ...restPopoverContentProps } = popoverContentProps;

    // To allow the consumer of `DatePicker` be able to do something
    // when the popover opens or closes.
    useEffect(() => {
        if (open && !prevOpen.current) {
            onOpen?.();
        }

        if (!open && prevOpen.current) {
            onClose?.();
        }

        prevOpen.current = open;
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <DatePickerButton className={cn(width, className)} open={open} isDateSet={isDateSet}>
                    {isRange ? <IconCalendarRange size={18} /> : <IconCalendarSingle size={18} />}
                    {isDateSet ? selectedText : placeholder}
                </DatePickerButton>
            </PopoverTrigger>
            <PopoverContent
                className={cn("w-auto border-none p-0", popoverContentClassname)}
                align="start"
                container={container}
                {...restPopoverContentProps}
            >
                <Calendar
                    dates={dates}
                    onDatesChange={onDatesChangeProp ?? setDates}
                    offsetDate={offsetDate}
                    onOffsetChange={onOffsetChangeProp ?? setOffsetDate}
                    mode={mode}
                    time={time}
                    config={config}
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
                "border-input-border text-input-placeholder bg-input-bg flex h-10 items-center justify-start gap-x-2 rounded-md border-1 p-2 text-left text-sm font-normal enabled:hover:cursor-pointer",
                {
                    "active-focus": open,
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
