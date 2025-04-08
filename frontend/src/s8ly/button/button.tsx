import { ComponentProps, FC } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    [
        "inline-flex",
        "items-center",
        "justify-center",
        "relative",
        "transition",
        "rounded-xl",
        "tracking-wide",
        "outline-none",
        "font-poppins",
        "font-bold",
        "focus-visible:outline-3",
        "focus-visible:outline-offset-3",
        "focus-visible:outline-solid",
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-primary-500",
                    "text-primary-950",
                    "disabled:bg-primary-950",
                    "disabled:text-primary-700",
                    "focus-visible:outline-primary-400",
                ],
                secondary: [
                    "bg-secondary-500",
                    "text-secondary-950",
                    "disabled:bg-secondary-950",
                    "disabled:text-secondary-700",
                    "focus-visible:outline-secondary-400",
                ],
            },
            size: {
                small: [
                    "text-sm",
                    "py-2",
                    "px-6",
                    "focus-visible:outline-2",
                    "focus-visible:outline-offset-2",
                ],
                default: ["text-base", "py-3", "px-9"],
                large: ["text-lg", "py-4", "px-16"],
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

const Button: FC<ButtonProps> = (props) => {
    const {
        className,
        children,
        disabled,
        loading = false,
        size = "default",
        variant = "primary",
        ...rest
    } = props;

    return (
        <button
            className={cn(buttonVariants({ variant, size, className }), {
                "active:scale-[0.98]": !loading && !disabled,
                "cursor-pointer": !loading,
                "hover:bg-primary-600":
                    !loading && !disabled && variant === "primary",
                "active:bg-primary-500":
                    !loading && !disabled && variant === "primary",
                "hover:bg-secondary-600":
                    !loading && !disabled && variant === "secondary",
                "active:bg-secondary-500":
                    !loading && !disabled && variant === "secondary",
                "cursor-not-allowed": loading || disabled,
            })}
            disabled={disabled}
            {...rest}
        >
            {loading && <Loading variant={variant} />}
            <span
                className={cn("transition", {
                    "opacity-0": loading,
                    "opacity-100": !loading,
                })}
            >
                {children}
            </span>
        </button>
    );
};

const loadingVariant = cva(["absolute", "inline-flex", "items-center"], {
    variants: {
        variant: {
            primary: ["border-seondary-950"],
            secondary: ["border-primary-950"],
        },
    },
});

const Loading: FC<VariantProps<typeof loadingVariant>> = ({ variant }) => {
    return (
        <div className={loadingVariant({ variant })}>
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-[inherit] border-b-transparent" />
        </div>
    );
};

Button.displayName = "s8ly_Button";

export { Button };
export type { ButtonProps };
