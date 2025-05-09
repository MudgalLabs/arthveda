import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { IconCheck, IconDash } from "@/components/icons";
import { cn } from "@/lib/utils";

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            className={cn(
                "peer border-border dark:bg-border/30 data-[state=checked]:bg-primary data-[state=checked]:text-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-foreground focus-visible:border-border focus-visible:ring-border/50 aria-invalid:border-background-red size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current transition-none">
                {props.checked === "indeterminate" ? (
                    <IconDash />
                ) : (
                    <IconCheck />
                )}
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
