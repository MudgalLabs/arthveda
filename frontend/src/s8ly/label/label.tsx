import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

export interface LabelProps extends ComponentProps<"label"> {}

export const Label: FC<LabelProps> = ({ children, className, ...rest }) => {
    return (
        <label
            className={cn(
                "text-primary-300 focus:outline-primary-300 text-sm font-semibold focus:outline-1 focus:outline-offset-3",
                className
            )}
            {...rest}
        >
            {children}
        </label>
    );
};
