import { FC, ComponentProps, useState } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
    hidePlaceholderOnFocus?: boolean;
    type?:
        | "email"
        | "number"
        | "password"
        | "search"
        | "tel"
        | "text"
        | "url"
        | "file";
    value?: string | number | readonly string[] | undefined;
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
                "bg-muted text-foreground border-border h-10 w-full min-w-[300px] rounded-md border-1 p-3 text-sm sm:w-[300px]",
                "focus:border-accent focus:bg-background focus:border-1",
                "disabled:opacity-69",
                "transition-all outline-none disabled:cursor-not-allowed",
                {
                    "file:bg-accent-muted file:text-foreground hover:file:bg-accent p-0 file:mr-4 file:h-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold hover:cursor-pointer hover:file:cursor-pointer sm:w-[420px]":
                        props.type === "file",
                    "border-border-red!": variant === "error",
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
