import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva(
    "w-fit flex items-center justify-center  font-medium rounded-sm border-1 text-sm px-3 py-1",
    {
        variants: {
            variant: {
                primary:
                    "bg-surface-bg border-surface-border text-surface-foreground",
                muted: "bg-muted border-border text-foreground",
                success:
                    "bg-success-bg border-success-border text-success-foreground",
                destructive:
                    "bg-error-bg border-error-border text-error-foreground",
                filter: "font-normal text-sm! bg-muted border-muted text-muted-foreground flex items-centerr gap-x-2 px-2! py-1!",
            },
        },
        defaultVariants: {
            variant: "muted",
        },
    }
);

interface TagProps extends VariantProps<typeof tagVariants> {
    children: ReactNode;
    className?: string;
}

function Tag(props: TagProps) {
    const { children, className, variant = "muted" } = props;
    return (
        <div className={cn(tagVariants({ variant, className }))}>
            {children}
        </div>
    );
}

export { Tag };
export type { TagProps };
