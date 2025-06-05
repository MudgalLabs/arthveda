import { ComponentProps, FC, memo } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/loading";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-heading font-content font-medium transition-all disabled:opacity-69 disabled:cursor-not-allowed enabled:active:scale-[0.98] cursor-pointer",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-foreground enabled:hover:bg-primary/90 enabled:active:bg-primary focus-visible:ring-foreground!",
                secondary:
                    "bg-accent-muted text-foreground enabled:hover:bg-accent-muted/80 enabled:active:bg-accent-muted",
                outline:
                    "bg-transparent text-foreground border-1 border-accent-muted enabled:hover:bg-accent-muted",
                destructive:
                    "bg-red-bg text-red-foreground enabled:hover:bg-red-bg/90 focus-visible:ring-foreground!",
                success:
                    "bg-green-bg text-green-foreground enabled:hover:bg-green-bg/90 focus-visible:ring-foreground!",
                ghost: "enabled:hover:bg-accent-muted enabled:hover:text-foreground",
                link: "text-link underline-offset-4 hover:underline",
            },
            size: {
                default: "text-base px-4 py-2 ",
                small: "text-sm px-3 py-1.5 font-normal",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

interface ButtonProps
    extends ComponentProps<"button">,
        VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

const Button: FC<ButtonProps> = memo((props) => {
    const {
        className,
        children,
        disabled,
        loading = false,
        variant = "primary",
        size = "default",
        ...rest
    } = props;

    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && (
                <div className="absolute inline-flex items-center">
                    <Loading color="var(--color-foreground)" />
                </div>
            )}

            <span
                className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition",
                    {
                        "opacity-0": loading,
                        "opacity-100": !loading,
                    }
                )}
            >
                {children}
            </span>
        </button>
    );
});

Button.displayName = "s8ly_Button";

export { Button, buttonVariants };
export type { ButtonProps };
