import { cn } from "@/lib/utils";
import { FC } from "react";
import { Link, LinkProps } from "react-router-dom";

export const LinkText: FC<LinkProps> = (props) => {
    const { children, className, ...rest } = props;

    return (
        <Link
            className={cn(
                "text-primary-500 text-right text-sm font-bold",
                className
            )}
            {...rest}
        >
            {children}
        </Link>
    );
};

LinkText.displayName = "LinkText";
