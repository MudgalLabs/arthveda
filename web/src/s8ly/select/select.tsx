import { FC, ReactNode, Ref } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { IconCheck, IconChevronDown, IconChevronUp } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useControlled } from "@/hooks/use_controlled";
import { Loading } from "@/components/loading";
import { InputErrorMessage } from "@/components/input_error_message";

interface SelectOptionItem<T = string> {
    value: T;
    label: string | ReactNode;
    disabled?: boolean;
}

interface SelectProps extends SelectPrimitive.SelectProps {
    ref?: Ref<HTMLButtonElement>;
    container?: HTMLElement | null;
    options: SelectOptionItem[];
    placeholder?: ReactNode;
    classNames?: {
        content?: string;
        trigger?: string;
        item?: string;
    };
    loading?: boolean;
    error?: boolean;
    errorMsg?: string;
}

const Select: FC<SelectProps> = ({
    ref,
    container,
    children,
    options,
    classNames,
    disabled,
    loading,
    error,
    errorMsg,
    placeholder,
    defaultValue = "",
    value: valueProp,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    ...props
}) => {
    const [value, setValue] = useControlled({
        controlled: valueProp,
        default: defaultValue,
        name: "value",
    });

    const [open, setOpen] = useControlled({
        controlled: openProp,
        default: defaultOpen,
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
            disabled={disabled || loading}
            data-disabled={disabled || loading}
            {...props}
        >
            <SelectPrimitive.Trigger
                ref={ref}
                className={cn(
                    "bg-muted text-foreground border-border flex h-10 w-full items-center justify-between gap-x-4 rounded-md border-1 p-3 enabled:cursor-pointer sm:w-[240px]",
                    "focus:outline-accent text-sm focus:outline-1 focus:outline-offset-0",
                    {
                        "text-foreground-muted": !value,
                        "opacity-60 disabled:cursor-not-allowed": disabled || loading,
                        "border-border-red relative": error,
                    },
                    classNames?.trigger
                )}
            >
                {loading ? (
                    <div className="flex-center w-full">
                        <Loading />
                    </div>
                ) : (
                    <>
                        <SelectPrimitive.Value placeholder={placeholder ?? "Choose"} />
                        <SelectPrimitive.Icon
                            className={cn("text-primary-500", {
                                "-rotate-180 transition-transform": open,
                                "rotate-0 transition-transform": !open,
                                "text-primary-300": value,
                            })}
                        >
                            <IconChevronDown size={20} />
                        </SelectPrimitive.Icon>
                    </>
                )}
            </SelectPrimitive.Trigger>

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}

            <SelectPrimitive.Portal container={container}>
                <SelectPrimitive.Content
                    position="popper"
                    className={cn(
                        "border-border bg-background z-100 mt-1 w-[240px] rounded-md border-1 text-sm",
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
                                className={classNames?.item}
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

const SelectItem: FC<SelectItemProps> = ({ ref, children, className, disabled, ...props }) => {
    return (
        <SelectPrimitive.Item
            ref={ref}
            data-disabled={disabled}
            className={cn(
                "enabled:hover:bg-muted focus:bg-muted data-[disabled=true]:text-foreground-muted m-1 flex h-fit items-center justify-between rounded-md px-2 py-3 hover:cursor-pointer focus:outline-none data-[disabled=true]:hover:cursor-not-allowed",
                className
            )}
            disabled={disabled}
            {...props}
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator>
                <IconCheck size={24} className="text-foreground-muted" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
};

export { Select };
export type { SelectProps, SelectOptionItem };
