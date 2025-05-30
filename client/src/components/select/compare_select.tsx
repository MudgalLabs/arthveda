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

export function compareOperatorToString(operator: CompareOperator): string {
    switch (operator) {
        case CompareOperator.GTE:
            return ">=";
        case CompareOperator.GT:
            return ">";
        case CompareOperator.LTE:
            return "<=";
        case CompareOperator.LT:
            return "<";
        case CompareOperator.EQ:
            return "==";
        default:
            return operator;
    }
}

const options = [
    {
        value: CompareOperator.GTE,
        label: compareOperatorToString(CompareOperator.GTE),
    },
    {
        value: CompareOperator.GT,
        label: compareOperatorToString(CompareOperator.GT),
    },
    {
        value: CompareOperator.LTE,
        label: compareOperatorToString(CompareOperator.LTE),
    },
    {
        value: CompareOperator.LT,
        label: compareOperatorToString(CompareOperator.LT),
    },
    {
        value: CompareOperator.EQ,
        label: compareOperatorToString(CompareOperator.EQ),
    },
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
