import { PositionStatus } from "@/features/position/position";
import { cn } from "@/lib/utils";
import { Select, SelectOptionItem, SelectProps } from "netra";

export type PositionStatusFilterValue = PositionStatus | "all";

interface PositionStatusSelectProps extends Omit<SelectProps, "options"> {
    defaultValue?: PositionStatusFilterValue;
    value?: PositionStatusFilterValue;
    onValueChange?: (value: PositionStatusFilterValue) => void;
}

export function PositionStatusSelect({ defaultValue = "open", classNames, ...props }: PositionStatusSelectProps) {
    const options: SelectOptionItem<PositionStatusFilterValue>[] = [
        {
            label: "All",
            value: "all",
        },
        {
            label: "Open",
            value: "open",
        },
        {
            label: "Breakeven",
            value: "breakeven",
        },
        {
            label: "Win",
            value: "win",
        },
        {
            label: "Loss",
            value: "loss",
        },
    ];

    return (
        <Select
            classNames={{
                trigger: cn("w-35!", classNames?.trigger),
                content: cn("w-35!", classNames?.content),
                item: classNames?.item,
            }}
            options={options}
            defaultValue={defaultValue}
            {...props}
        />
    );
}
