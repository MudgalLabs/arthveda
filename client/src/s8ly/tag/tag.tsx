import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva("w-fit text-center font-medium rounded-sm border-1", {
    variants: {
        variant: {
            primary:
                "bg-surface-bg border-surface-border text-surface-foreground",
            muted: "bg-muted border-border text-foreground",
            success:
                "bg-success-bg border-success-border text-success-foreground",
            destructive:
                "bg-error-bg border-error-border text-error-foreground",
            filter: "bg-muted border-border text-foreground flex items-center gap-x-2 px-2 py-1 text-sm",
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
