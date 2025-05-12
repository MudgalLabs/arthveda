import { Select, SelectProps } from "@/s8ly";
import { cn } from "@/lib/utils";

const enum Compare {
    /** Equal or greater than */
    EGT = "egt",
    /**  Greater than */
    GT = "gt",
    /**  Equal or less than */
    ELT = "elt",
    /** Less than */
    LT = "lt",
    /** Equal to */
    EQ = "eq",
}

const options = [
    { value: Compare.EGT, label: ">=" },
    { value: Compare.GT, label: ">" },
    { value: Compare.ELT, label: "<=" },
    { value: Compare.LT, label: "<" },
    { value: Compare.EQ, label: "==" },
];

function CompareSelect({ classNames, ...props }: Omit<SelectProps, "options">) {
    return (
        <Select
            classNames={{
                trigger: cn("w-20", classNames?.trigger),
                content: cn("w-20", classNames?.content),
            }}
            options={options}
            defaultValue={Compare.EGT}
            {...props}
        />
    );
}

export { CompareSelect };
