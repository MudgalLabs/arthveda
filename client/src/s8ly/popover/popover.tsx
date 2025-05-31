import { FC, Ref } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps extends PopoverPrimitive.PopoverContentProps {
    ref?: Ref<HTMLDivElement>;
    container?: HTMLElement | null;
}

const PopoverContent: FC<PopoverContentProps> = ({
    ref,
    container,
    children,
    className,
    align = "center",
    sideOffset = 4,
    ...props
}) => (
    <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
            className={cn(
                "bg-muted text-foreground border-border-muted z-60 rounded-md border-1 px-3 py-2 shadow-md outline-hidden",
                className
            )}
            sideOffset={sideOffset}
            align={align}
            ref={ref}
            {...props}
        >
            {children}
            <PopoverPrimitive.Arrow fill="var(--color-accent)" />
        </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
);

export { Popover, PopoverTrigger, PopoverContent };
