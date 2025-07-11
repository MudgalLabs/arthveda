import { ComponentProps, FC } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends ComponentProps<"label"> {}

export const Label: FC<LabelProps> = ({ children, className, htmlFor, ...rest }) => {
    return (
        <label className={cn("label", className)} htmlFor={htmlFor} {...rest}>
            {children}
        </label>
    );
};
