import { ComponentProps, FC } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends ComponentProps<"label"> {
    required?: boolean;
}

export const Label: FC<LabelProps> = ({ children, className, htmlFor, required, ...rest }) => {
    return (
        <label className={cn("label", className)} htmlFor={htmlFor} {...rest}>
            {children} {required && <span className="text-text-muted">*</span>}
        </label>
    );
};
