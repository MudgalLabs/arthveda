import { FC, Ref } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps extends PopoverPrimitive.PopoverContentProps {
    ref?: Ref<HTMLDivElement>;
}

const PopoverContent: FC<PopoverContentProps> = ({
    ref,
    children,
    className,
    align = "center",
    sideOffset = 4,
    ...props
}) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            className={cn(
                "bg-muted text-muted-foreground border-border z-50 rounded-md border-1 p-4 shadow-md outline-hidden",
                className
            )}
            sideOffset={sideOffset}
            align={align}
            ref={ref}
            {...props}
        >
            {children}
            <PopoverPrimitive.Arrow fill="var(--color-border-muted)" />
        </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
);

export { Popover, PopoverTrigger, PopoverContent };
