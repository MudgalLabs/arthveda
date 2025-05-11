import { FC, ReactNode, Ref } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { IconCheck, IconChevronDown, IconChevronUp } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useControlled } from "@/hooks/use-controlled";

export interface SelectProps extends SelectPrimitive.SelectProps {
    options: { value: string; label: string; disabled?: boolean }[];
    ref?: Ref<HTMLButtonElement>;
    placeholder?: ReactNode;
    classNames?: {
        content?: string;
        trigger?: string;
    };
}

export const Select: FC<SelectProps> = ({
    children,
    ref,
    options,
    classNames,
    placeholder,
    defaultValue,
    value: valueProp,
    defaultOpen,
    open: openProp,
    onOpenChange,
    ...props
}) => {
    const [value, setValue] = useControlled({
        controlled: valueProp,
        default: "",
        name: "value",
    });

    const [open, setOpen] = useControlled({
        controlled: openProp,
        default: false,
        name: "open",
    });

    return (
        <SelectPrimitive.Root
            open={open}
            onOpenChange={(v) => setOpen(v)}
            value={value}
            onValueChange={setValue}
            defaultValue={defaultValue}
            defaultOpen={defaultOpen}
            {...props}
        >
            <SelectPrimitive.Trigger
                ref={ref}
                className={cn(
                    "bg-muted text-foreground border-border flex w-[300px] cursor-pointer items-center justify-between gap-x-4 rounded-md border-1 p-3",
                    "focus:outline-accent text-sm focus:outline-1 focus:outline-offset-0",
                    {
                        "text-foreground-muted": !value,
                    },
                    classNames?.trigger
                )}
            >
                <SelectPrimitive.Value placeholder={placeholder ?? "Choose"} />
                <SelectPrimitive.Icon
                    className={cn("text-primary-500", {
                        "rotate-180 transition-transform": open,
                        "rotate-0 transition-transform": !open,
                        "text-primary-300": value,
                    })}
                >
                    <IconChevronDown size={20} />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    className={cn(
                        "border-border bg-background-1 mt-1 w-[300px] rounded-md border-1 text-sm",
                        classNames?.content
                    )}
                >
                    <SelectPrimitive.ScrollUpButton>
                        <IconChevronUp />
                    </SelectPrimitive.ScrollUpButton>

                    <SelectPrimitive.Viewport>
                        {options.map((option, idx) => (
                            <SelectItem
                                key={`${option.value}${idx}`}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectPrimitive.Viewport>

                    <SelectPrimitive.ScrollDownButton>
                        <IconChevronDown />
                    </SelectPrimitive.ScrollDownButton>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
};

interface SelectItemProps extends SelectPrimitive.SelectItemProps {
    ref?: Ref<HTMLDivElement>;
}

const SelectItem: FC<SelectItemProps> = ({ children, ref, ...props }) => {
    return (
        <SelectPrimitive.Item
            {...props}
            ref={ref}
            className="hover:bg-muted focus:bg-muted disabled:text-foreground-muted m-1 flex cursor-pointer items-center justify-between rounded-md px-2 py-3 focus:outline-none"
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator>
                <IconCheck size={24} className="text-foreground-muted" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
};
