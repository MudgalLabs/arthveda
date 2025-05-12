import { createContext, useContext } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { VariantProps } from "class-variance-authority";

import { toggleVariants } from "@/s8ly";
import { cn } from "@/lib/utils";

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
    size: "default",
    variant: "default",
});

function ToggleGroup({
    className,
    variant,
    size,
    children,
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>) {
    return (
        <ToggleGroupPrimitive.Root
            data-variant={variant}
            data-size={size}
            className={cn(
                "group/toggle-group bg-muted flex w-fit items-center gap-x-1.5 rounded-md p-1",
                className
            )}
            {...props}
        >
            <ToggleGroupContext.Provider value={{ variant, size }}>
                {children}
            </ToggleGroupContext.Provider>
        </ToggleGroupPrimitive.Root>
    );
}

function ToggleGroupItem({
    className,
    children,
    variant,
    size,
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>) {
    const context = useContext(ToggleGroupContext);

    return (
        <ToggleGroupPrimitive.Item
            data-variant={context.variant || variant}
            data-size={context.size || size}
            className={cn(
                toggleVariants({
                    variant: context.variant || variant,
                    size: context.size || size,
                }),
                "border-r-none flex-1 shrink-0 rounded-sm focus:z-10 focus-visible:z-1",
                className
            )}
            {...props}
        >
            {children}
        </ToggleGroupPrimitive.Item>
    );
}

export { ToggleGroup, ToggleGroupItem };
