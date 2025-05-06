import { ComponentProps, FC } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md font-heading font-content font-bold transition-all outline-none disabled:opacity-69 active:scale-[0.98] cursor-pointer disabled:pointer-events-none h-9 px-4 py-2 has-[>svg]:px-3",

    {
        variants: {
            variant: {
                primary:
                    "bg-primary-500 text-primary-950 hover:bg-primary-400 active:bg-primary-500",
                secondary:
                    "bg-secondary-500 text-secondary-950 hover:bg-secondary-600 active:bg-secondary-500",
                muted: "bg-foreground text-primary-950 hover:bg-foreground-muted active:bg-foreground",
                outline:
                    "bg-transparent text-foreground border-1 border-border hover:bg-muted hover:border-muted",
                icon: "border-1 border-border text-foreground-muted hover:bg-muted hover:text-foreground hover:border-transparent size-9",
            },
        },
        defaultVariants: {
            variant: "primary",
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
        variant = "primary",
        ...rest
    } = props;

    return (
        <button
            className={cn(buttonVariants({ variant, className }), {})}
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
};

const loadingVariant = cva(["absolute", "inline-flex", "items-center"], {
    variants: {
        variant: {
            primary: ["border-seondary-950"],
            secondary: ["border-primary-950"],
            muted: ["border-muted"],
            outline: ["border-muted-foreground"],
            icon: ["border-primary-500"],
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
