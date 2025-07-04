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
                    "bg-input-bg text-foreground border-input-border h-10 w-full rounded-md border-1 p-3 text-sm sm:w-[300px]",
                    "placeholder:text-input-placeholder disabled:opacity-69",
                    "transition-all outline-none disabled:cursor-not-allowed",
                    {
                        "file:bg-secondary file:text-foreground p-0 file:mr-4 file:h-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium hover:cursor-pointer hover:file:cursor-pointer sm:w-[420px]":
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
