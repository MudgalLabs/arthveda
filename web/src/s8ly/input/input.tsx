import { FC, ComponentProps, useState } from "react";

import { cn } from "@/lib/utils";
import { InputErrorMessage } from "@/components/input_error_message";

interface InputProps extends ComponentProps<"input"> {
    hidePlaceholderOnFocus?: boolean;
    type?: "email" | "number" | "password" | "search" | "tel" | "text" | "url" | "file";
    value?: string | number | readonly string[] | undefined;
    variant?: "default" | "error" | undefined;
    errorMsg?: string;
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
        errorMsg,
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

    const error = variant === "error";

    return (
        <>
            <input
                className={cn(
                    "text-text-primary border-border-soft placeholder-text-placeholder h-10 w-full rounded-md border-1 bg-transparent p-3 text-sm transition-colors outline-none disabled:opacity-69 sm:w-[300px]",
                    "hover:border-border-hover focus:border-tranparent focus-visible:border-accent focus-visible:ring-0",
                    {
                        "file:bg-secondary file:text-foreground p-0 file:mr-4 file:h-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium sm:w-[420px]":
                            props.type === "file",
                        "border-b-border-red": error,
                    },
                    className
                )}
                disabled={disabled}
                placeholder={placeholder}
                onFocus={handleOnFocus}
                onBlur={handleOnBlur}
                {...rest}
            />

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
};

Input.displayName = "s8ly_Input";

export { Input };
export type { InputProps };
