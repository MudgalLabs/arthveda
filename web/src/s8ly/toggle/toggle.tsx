import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-sm text-base font-medium enabled:hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-btn-bg-primary data-[state=on]:text-btn-text-primary [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 transition-[color,box-shadow] border-1 border-transparent data-[state=off]:enabled:hover:bg-accent-muted py-2.5 px-2.5",
    {
        variants: {
            variant: {
                default: "text-muted-foreground",
                outline:
                    "data-[state=off]:border border-border bg-transparent text-foreground-muted shadow-xs data-[state=off]:enabled:hover:bg-accent-muted data-[state=off]:enabled:hover:text-muted-foreground",
                success:
                    "data-[state=on]:bg-btn-bg-secondary data-[state=on]:text-btn-text-secondary data-[state=on]:border-btn-border-secondary",
                destructive: "data-[state=on]:bg-red-bg data-[state=on]:text-foreground",
                // success:
                //     "data-[state=on]:bg-success-bg data-[state=on]:text-success-foreground data-[state=on]:border-success-border",
                // destructive:
                //     "data-[state=on]:bg-error-bg data-[state=on]:text-error-foreground data-[state=on]:border-error-border",
            },
            size: {
                default: "",
                small: "text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface ToggleProps extends TogglePrimitive.ToggleProps, VariantProps<typeof toggleVariants> {}

function Toggle({ className, variant = "default", size = "default", ...props }: ToggleProps) {
    return (
        <TogglePrimitive.Root
            data-slot="toggle"
            className={cn(toggleVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Toggle, toggleVariants };
export type { ToggleProps };
