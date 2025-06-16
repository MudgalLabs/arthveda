import { ComponentProps, FC, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends ComponentProps<"label"> {}

export const Label: FC<LabelProps> = ({ children, className, htmlFor, ...rest }) => {
    const [isInteractive, setIsInteractive] = useState(false);

    useEffect(() => {
        if (htmlFor) {
            const associatedElement = document.getElementById(htmlFor);
            if (associatedElement) {
                setIsInteractive(true);
            }
        }
    }, [htmlFor]);

    return (
        <label className={cn("label", className, isInteractive && "cursor-pointer")} htmlFor={htmlFor} {...rest}>
            {children}
        </label>
    );
};
