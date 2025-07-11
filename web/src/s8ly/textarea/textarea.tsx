import { FC, ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { InputErrorMessage } from "@/components/input_error_message";

interface TextareaProps extends ComponentProps<"textarea"> {
    error?: boolean;
    errorMsg?: string;
}

const Textarea: FC<TextareaProps> = ({ className, error, errorMsg, ...props }) => {
    return (
        <>
            <textarea
                className={cn(
                    "border-border-soft placeholder-text-placeholder flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent p-3 text-sm transition-colors outline-none disabled:opacity-69",
                    "hover:border-border-accent focus-visible:outline-primary focus:border-tranparent",
                    "hover:border-border-hover focus:border-tranparent focus-visible:border-azure-500 focus-visible:ring-0",
                    {
                        "border-b-border-red": error,
                    },
                    className
                )}
                {...props}
            />

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
};

export { Textarea };
export type { TextareaProps };
