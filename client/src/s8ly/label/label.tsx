import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

export interface LabelProps extends ComponentProps<"label"> {}

export const Label: FC<LabelProps> = ({ children, className, ...rest }) => {
    return (
        <label
            className={cn("text-foreground text-sm font-medium", className)}
            {...rest}
        >
            {children}
        </label>
    );
};
