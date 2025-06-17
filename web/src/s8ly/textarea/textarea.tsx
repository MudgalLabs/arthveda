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
                    "border-border placeholder:text-foreground-muted bg-background focus:border-accent flex field-sizing-content min-h-16 w-full rounded-md border p-3 text-base transition-[color] outline-none disabled:cursor-not-allowed disabled:opacity-69",
                    {
                        "border-border-red!": error,
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
