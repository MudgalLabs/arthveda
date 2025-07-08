import { ComponentProps, FC, memo } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/loading";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-heading font-content transition-colors disabled:opacity-69 disabled:cursor-not-allowed enabled:active:scale-[0.98] cursor-pointer border-1 border-transparent",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-foreground enabled:hover:bg-primary/90 enabled:active:bg-primary focus-visible:ring-foreground!",
                secondary:
                    "bg-btn-bg-secondary text-btn-text-secondary border-btn-border-secondary enabled:hover:bg-btn-hover-secondary enabled:active:bg-secondary",
                outline: "bg-transparent text-foreground border-accent-muted enabled:hover:bg-accent-muted",
                destructive: "bg-red-bg text-foreground enabled:hover:bg-red-bg/90 focus-visible:ring-foreground!",
                success: "bg-green-bg text-foreground enabled:hover:bg-green-bg/90 focus-visible:ring-foreground!",
                ghost: "enabled:hover:bg-accent-muted enabled:hover:text-foreground",
                link: "text-link underline-offset-4 hover:underline p-0! h-fit!",
            },
            size: {
                default: "text-sm px-4 h-9",
                small: "text-xs px-3 font-normal h-8",
                large: "text-base px-3 h-10 font-medium",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

const Button: FC<ButtonProps> = memo((props) => {
    const { className, children, disabled, loading = false, variant = "primary", size = "default", ...rest } = props;

    return (
        <button
            className={cn("relative", buttonVariants({ variant, size, className }))}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && (
                <div className="absolute inset-0 inline-flex items-center justify-center">
                    <Loading color="currentColor" />
                </div>
            )}

            <span
                className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap transition", {
                    "opacity-0": loading,
                    "opacity-100": !loading,
                })}
            >
                {children}
            </span>
        </button>
    );
});

Button.displayName = "s8ly_Button";

export { Button, buttonVariants };
export type { ButtonProps };
