import { ComponentProps, FC, memo } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-heading font-content font-bold transition-all disabled:opacity-69 disabled:cursor-not-allowed enabled:active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-foreground/10 focus-visible:ring-offset-[1px] focus-visible:ring-[1px]",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-foreground enabled:hover:bg-primary/90 enabled:active:bg-primary",
                secondary:
                    "bg-secondary text-foreground enabled:hover:bg-secondary/80 enabled:active:bg-secondary",
                outline:
                    "bg-transparent text-foreground border-1 border-accent enabled:hover:bg-accent enabled:hover:text-foreground",
                destructive:
                    "bg-background-red text-foreground enabled:hover:bg-background-red/90 focus-visible:bg-background-red/20",
                success:
                    "bg-background-green text-foreground enabled:hover:bg-background-green/90 focus-visible:bg-background-green/20",
                ghost: "enabled:hover:bg-accent enabled:hover:text-foreground",
                link: "text-link underline-offset-4 hover:underline",
            },
            size: {
                default: "text-base px-4 py-2 ",
                small: "text-sm px-3 py-1.5 ",
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
            className={cn(buttonVariants({ variant, size, className }), {})}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && <Loading variant={variant} />}
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

const loadingVariant = cva(["absolute", "inline-flex", "items-center"], {
    variants: {
        variant: {
            primary: "border-foreground",
            secondary: "border-foreground",
            outline: "border-primary",
            destructive: "border-foreground",
            success: "border-foreground",
            ghost: "border-primary",
            link: "border-primary",
        },
    },
});

const Loading: FC<VariantProps<typeof loadingVariant>> = ({ variant }) => {
    return (
        <div className={loadingVariant({ variant })}>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[inherit] border-b-transparent" />
        </div>
    );
};

Button.displayName = "s8ly_Button";

export { Button };
export type { ButtonProps };
