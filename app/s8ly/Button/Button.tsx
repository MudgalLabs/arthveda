import { forwardRef, FC } from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  [
    "inline-flex",
    "items-center",
    "justify-center",
    "relative",
    "transition",
    "rounded-xl",
    "disabled:cursor-not-allowed",
    "tracking-wide",
    "outline-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "font-semibold",
          "bg-primary",
          "text-foreground-knight",
          "disabled:bg-primary-disabled",
          "active:bg-primary",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-3",
          "focus-visible:outline-solid",
          "focus-visible:outline-primary-border",
        ],
        secondary: [
          "font-semibold",
          "bg-secondary",
          "text-foreground-primary",
          "disabled:bg-secondary-disabled",
          "active:bg-secondary",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-3",
          "focus-visible:outline-solid",
          "focus-visible:outline-secondary-border",
        ],
      },
      size: {
        small: ["text-sm", "py-2", "px-6"],
        default: ["text-base", "py-3", "px-9"],
        large: ["text-lg", "py-4", "px-16"],
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

const loading = cva(["absolute", "inline-flex", "items-center"], {
  variants: {
    variant: {
      primary: ["border-black"],
      secondary: ["border-white"],
    },
  },
});

const Loading: FC<VariantProps<typeof loading>> = ({ variant }) => {
  return (
    <div className={loading({ variant })}>
      <div className="h-6 w-6 animate-spin rounded-full border-3 border-[inherit] border-b-transparent" />
    </div>
  );
};

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      disabled,
      loading = false,
      size = "default",
      variant = "primary",
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(variants({ variant, size, className }), {
          "active:scale-[0.98]": !loading && !disabled,
          "cursor-pointer": !loading,
          "hover:bg-primary-hover":
            !loading && !disabled && variant === "primary",
          "hover:bg-secondary-hover":
            !loading && !disabled && variant === "secondary",
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
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
