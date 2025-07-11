import { ComponentProps, FC, memo } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/loading";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-content font-medium transition-colors disabled:opacity-69 enabled:active:scale-[0.98] border-1 border-transparent",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-foreground enabled:hover:bg-primary-hover enabled:active:bg-primary focus-visible:ring-foreground!",
                secondary:
                    "bg-secondary text-text-primary border-border-soft enabled:hover:bg-secondary-hover enabled:active:bg-secondary",
                outline: "bg-transparent text-foreground border-accent-muted enabled:hover:bg-accent-muted",
                destructive:
                    "bg-transparent text-text-destructive enabled:hover:bg-text-destructive/10 focus-visible:ring-foreground!",
                success: "bg-green-bg text-foreground enabled:hover:bg-green-bg/90 focus-visible:ring-foreground!",
                ghost: "text-text-muted enabled:hover:bg-secondary-hover enabled:hover:text-text-primary",
                link: "text-accent underline-offset-4 hover:underline p-0! h-fit!",
            },
            size: {
                default: "text-sm px-3 h-9",
                small: "text-xs px-2 font-normal h-8",
                large: "text-base px-3 h-10 font-medium",
                icon: "h-8 w-8",
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
