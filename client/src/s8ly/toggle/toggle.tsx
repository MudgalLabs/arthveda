import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-md text-base font-normal enabled:hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-foreground! data-[state=on]:font-semibold [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]",
    {
        variants: {
            variant: {
                default:
                    "bg-muted text-muted-foreground data-[state=off]:enabled:hover:bg-accent-muted",
                outline:
                    "border border-border bg-transparent text-foreground-muted shadow-xs data-[state=off]:enabled:hover:bg-muted data-[state=off]:enabled:hover:text-muted-foreground",
            },
            size: {
                default: "h-9 px-2 min-w-9",
                small: "h-8 px-1.5 min-w-8",
                large: "h-10 px-2.5 min-w-10",
                text: "px-3 py-2",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface ToggleProps
    extends TogglePrimitive.ToggleProps,
        VariantProps<typeof toggleVariants> {}

function Toggle({ className, variant, size, ...props }: ToggleProps) {
    return (
        <TogglePrimitive.Root
            data-slot="toggle"
            className={cn(toggleVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Toggle };
export type { ToggleProps };
