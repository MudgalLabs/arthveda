import { FC, ReactNode, Ref } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { IconCheck, IconChevronDown, IconChevronUp } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useControlled } from "@/hooks/use-controlled";

export interface SelectProps extends SelectPrimitive.SelectProps {
    items: { value: string; label: string }[];
    ref?: Ref<HTMLButtonElement>;
    placeholder?: ReactNode;
    className?: {
        content?: string;
        trigger?: string;
    };
}

export const Select: FC<SelectProps> = ({
    children,
    ref,
    items,
    className,
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
                    "bg-primary-950 text-foreground focus:outline-primary-500 flex items-center justify-between gap-x-4 rounded-md p-3",
                    "w-[300px] cursor-pointer focus:outline-1 focus:outline-offset-4",
                    {
                        "text-primary-300": !value,
                    },
                    className?.trigger
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
                        "bg-primary-950 mt-1 w-[300px] rounded-md",
                        className?.content
                    )}
                >
                    <SelectPrimitive.ScrollUpButton>
                        <IconChevronUp />
                    </SelectPrimitive.ScrollUpButton>

                    <SelectPrimitive.Viewport>
                        {items.map((i) => (
                            <SelectItem key={i.value} value={i.value}>
                                {i.label}
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
            className="hover:bg-primary-900 focus:bg-primary-900 m-1 flex cursor-pointer items-center justify-between rounded-md px-2 py-3 focus:outline-none"
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator>
                <IconCheck size={20} className="text-primary-300" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
};
