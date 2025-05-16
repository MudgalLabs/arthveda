import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva("font-semibold rounded-sm border-1", {
    variants: {
        variant: {
            primary: "bg-accent-muted border-accent text-primary",
            muted: "bg-accent-muted border-border-muted text-muted-foreground",
            success:
                "bg-background-green-muted border-border-green text-foreground-green",
            destructive:
                "bg-background-red-muted border-border-red text-foreground-red",
        },
        size: {
            default: "text-sm px-3 py-1",
        },
    },
    defaultVariants: {
        variant: "muted",
        size: "default",
    },
});

interface TagProps extends VariantProps<typeof tagVariants> {
    children: ReactNode;
    className?: string;
}

function Tag(props: TagProps) {
    const { children, className, variant = "muted", size = "default" } = props;
    return (
        <div className={cn(tagVariants({ variant, size, className }))}>
            {children}
        </div>
    );
}

export { Tag };
export type { TagProps };
