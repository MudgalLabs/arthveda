import { ComponentProps, FC, memo } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/loading";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-heading font-content font-medium transition-all disabled:opacity-69 disabled:cursor-not-allowed enabled:active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-foreground/10 focus-visible:ring-offset-[1px] focus-visible:ring-[1px]",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-foreground enabled:hover:bg-primary/90 enabled:active:bg-primary",
                secondary:
                    "bg-secondary text-foreground enabled:hover:bg-secondary/80 enabled:active:bg-secondary",
                outline:
                    "bg-transparent text-foreground border-1 border-accent-muted enabled:hover:bg-accent-muted enabled:hover:text-foreground",
                destructive:
                    "bg-background-red text-foreground enabled:hover:bg-background-red/90 focus-visible:bg-background-red/20",
                success:
                    "bg-background-green text-foreground enabled:hover:bg-background-green/90 focus-visible:bg-background-green/20",
                ghost: "enabled:hover:bg-accent-muted enabled:hover:text-foreground",
                link: "text-link underline-offset-4 hover:underline",
            },
            size: {
                default: "text-base px-4 py-2 ",
                small: "text-sm px-3 py-1.5 font-normal ",
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
