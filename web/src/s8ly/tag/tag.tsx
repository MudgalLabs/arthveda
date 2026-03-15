import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva("w-fit flex items-center justify-center rounded-sm border-1", {
    variants: {
        variant: {
            default: "bg-transparent border-border-subtle text-text-muted",
            muted: "bg-secondary border-border-subtle text-text-muted",
            // success: "bg-success-bg-2 border-success-border text-success-foreground-2",
            success: "bg-[hsl(142,70%,20%,0.25)] border-[hsl(142,60%,40%,0.35)] text-[hsl(142,70%,60%)]",
            // destructive: "bg-error-bg-2 border-error-border text-text-destructive-2",
            destructive: "bg-[hsl(0,70%,20%,0.25)] border-[hsl(0,65%,40%,0.35)] text-[hsl(0,80%,65%)]",
            filter: "font-normal text-sm! bg-surface-bg border-border text-muted-foreground flex items-center gap-x-2 pl-2! pr-1! py-1!",
            primary: "bg-surface-2 border-primary/50 text-accent",
        },
        size: {
            default: "text-sm px-2 py-1",
            small: "text-xs px-1.5 py-0.5",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});

interface TagProps extends VariantProps<typeof tagVariants> {
    children: ReactNode;
    className?: string;
}

function Tag(props: TagProps) {
    const { children, className, variant = "default", size = "default" } = props;
    return <div className={cn(tagVariants({ variant, size, className }))}>{children}</div>;
}

export { Tag };
export type { TagProps };
