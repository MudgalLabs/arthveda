import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva("w-fit flex items-center justify-center rounded-sm border-1", {
    variants: {
        variant: {
            default: "bg-surface-bg border-surface-border text-surface-foreground",
            success: "bg-success-bg border-success-border text-success-foreground",
            destructive: "bg-error-bg border-error-border text-error-foreground",
            filter: "font-normal text-sm! bg-surface-bg border-border text-muted-foreground flex items-center gap-x-2 pl-2! pr-1! py-1!",
        },
        size: {
            default: "text-sm px-3 py-1",
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
