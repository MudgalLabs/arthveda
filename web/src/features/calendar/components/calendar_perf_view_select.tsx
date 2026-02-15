import { Select, SelectOptionItem, SelectProps } from "netra";

export const enum CalendarPerfViewMode {
    GROSS_PNL = "gross_pnl",
    NET_PNL = "net_pnl",
    GROSS_R_FACTOR = "gross_r_factor",
}

interface CalendarPerfModeSelectProps extends Omit<SelectProps, "options"> {
    defaultValue?: CalendarPerfViewMode.GROSS_PNL;
    value?: CalendarPerfViewMode;
    onValueChange?: (value: CalendarPerfViewMode) => void;
}

export function CalendarPerfModeSelect(props: CalendarPerfModeSelectProps) {
    const options: SelectOptionItem[] = [
        {
            label: "Gross PnL",
            value: CalendarPerfViewMode.GROSS_PNL,
        },
        {
            label: "Net PnL",
            value: CalendarPerfViewMode.NET_PNL,
        },
        {
            label: "Gross R",
            value: CalendarPerfViewMode.GROSS_R_FACTOR,
        },
    ];

    return (
        <Select
            classNames={{
                trigger: "w-34!",
                content: "w-34!",
            }}
            options={options}
            {...props}
        />
    );
}
