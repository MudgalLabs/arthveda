import { Select, SelectProps } from "@/s8ly";
import { cn } from "@/lib/utils";

export const enum CompareOperator {
    /** Equal or greater than */
    GTE = "gte",
    /**  Greater than */
    GT = "gt",
    /**  Equal or less than */
    LTE = "lte",
    /** Less than */
    LT = "lt",
    /** Equal to */
    EQ = "eq",
}

const options = [
    { value: CompareOperator.GTE, label: ">=" },
    { value: CompareOperator.GT, label: ">" },
    { value: CompareOperator.LTE, label: "<=" },
    { value: CompareOperator.LT, label: "<" },
    { value: CompareOperator.EQ, label: "==" },
];

interface CompareSelectProps extends Omit<SelectProps, "options"> {
    defaultValue?: CompareOperator;
    value?: CompareOperator;
    onValueChange?: (value: CompareOperator) => void;
}

export function CompareSelect({ classNames, ...props }: CompareSelectProps) {
    return (
        <Select
            classNames={{
                trigger: cn("w-20!", classNames?.trigger),
                content: cn("w-20!", classNames?.content),
            }}
            options={options}
            defaultValue={CompareOperator.GTE}
            {...props}
        />
    );
}
