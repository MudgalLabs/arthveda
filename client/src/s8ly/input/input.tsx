import { FC, ComponentProps, useState } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
    hidePlaceholderOnFocus?: boolean;
    type?: "email" | "number" | "password" | "search" | "tel" | "text" | "url";
    value?: string | number;
    variant?: "default" | "error" | undefined;
}

const Input: FC<InputProps> = (props) => {
    const {
        className,
        disabled,
        hidePlaceholderOnFocus = false,
        onBlur,
        onFocus,
        placeholder: placeholderProp,
        variant,
        ...rest
    } = props;

    const [placeholder, setPlaceholderText] = useState(placeholderProp);

    function handleOnFocus(event: React.FocusEvent<HTMLInputElement>) {
        if (hidePlaceholderOnFocus) setPlaceholderText("");
        if (onFocus) onFocus(event);
    }

    function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
        if (hidePlaceholderOnFocus) setPlaceholderText(placeholderProp);
        if (onBlur) onBlur(event);
    }

    return (
        <input
            className={cn(
                "bg-muted text-foreground border-border h-10 w-[300px] rounded-md border-1 p-3 text-sm",
                "focus:border-accent focus:bg-background-1 focus:border-1",
                "disabled:opacity-69",
                "transition-all outline-none disabled:cursor-not-allowed",
                {
                    "border-rose-500": variant === "error",
                },
                className
            )}
            disabled={disabled}
            placeholder={placeholder}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            {...rest}
        />
    );
};

Input.displayName = "s8ly_Input";

export { Input };
export type { InputProps };
