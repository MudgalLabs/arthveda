import { FC, ComponentProps, useState } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
    type?: "email" | "number" | "password" | "search" | "tel" | "text" | "url";
    value?: string | number;
    hidePlaceholderOnFocus?: boolean;
    compact?: boolean;
}

const Input: FC<InputProps> = (props) => {
    const {
        className,
        compact,
        disabled,
        hidePlaceholderOnFocus,
        onBlur,
        onFocus,
        placeholder,
        ...rest
    } = props;

    const [placeholderText, setPlaceholderText] = useState(placeholder);

    function handleOnFocus(event: React.FocusEvent<HTMLInputElement>) {
        if (hidePlaceholderOnFocus) setPlaceholderText("");
        if (onFocus) onFocus(event);
    }

    function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
        if (hidePlaceholderOnFocus) setPlaceholderText(placeholder);
        if (onBlur) onBlur(event);
    }

    return (
        <input
            className={cn(
                "bg-primary-900 text-foreground-1 font-karla placeholder:text-foreground-3",
                "focus:bg-background-1 focus:border-primary-700 disabled:bg-primary-950 disabled:text-foreground-3",
                "box-border w-[300px] rounded-xl border-[2px] border-solid border-transparent p-[14px] text-sm font-normal",
                "transition outline-none hover:border-[2px] hover:border-solid disabled:cursor-not-allowed",
                {
                    "hover:border-primary-700": !disabled,
                    "rounded-lg px-[10px] py-[12px]": compact,
                },
                className
            )}
            disabled={disabled}
            placeholder={placeholderText}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            {...rest}
        />
    );
};

Input.displayName = "s8ly_Input";

export { Input };
export type { InputProps };
