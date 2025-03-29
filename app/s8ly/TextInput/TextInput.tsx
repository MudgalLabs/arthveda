"use client";

import { forwardRef, useState, useEffect } from "react";

import { cn } from "@/lib/utils";

interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "email" | "number" | "password" | "search" | "tel" | "text" | "url";
  value?: string | number;
  hidePlaceholderOnFocus?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const {
    className,
    disabled,
    hidePlaceholderOnFocus = true,
    onFocus,
    onBlur,
    placeholder = "",
    ...rest
  } = props;

  const [placeholderText, setPlaceholderText] = useState(placeholder);
  useEffect(() => setPlaceholderText(placeholder), [placeholder]);

  function handleOnFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (hidePlaceholderOnFocus) setPlaceholderText("");
    if (onFocus) onFocus(event);
  }

  function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (hidePlaceholderOnFocus) setPlaceholderText(placeholder);
    if (onBlur) onBlur(event);
  }

  return (
    <div>
      <input
        {...rest}
        disabled={disabled}
        placeholder={placeholderText}
        ref={ref}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        className={cn(
          "bg-primary-900 text-foreground-1 font-karla placeholder:text-foreground-3 focus:bg-background-1 focus:border-primary-700 disabled:bg-primary-950 disabled:text-foreground-3 box-border w-[300px] rounded-xl border-[2px] border-solid border-transparent p-[14px] text-sm font-normal transition outline-none hover:border-[2px] hover:border-solid disabled:cursor-not-allowed",
          {
            "hover:border-primary-700": !disabled,
          },
          className,
        )}
      />
    </div>
  );
});

TextInput.displayName = "s8ly_TextInput";

export { TextInput };
export type { TextInputProps };
