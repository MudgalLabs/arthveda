import { cn } from "@/lib/utils";
import { FC } from "react";
import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from "react-router-dom";

interface LinkProps extends RouterLinkProps {
    unstyled?: boolean;
}

export const Link: FC<LinkProps> = (props) => {
    const { children, className, unstyled, ...rest } = props;

    return (
        <RouterLink
            className={cn(
                "",
                {
                    "text-foreground-1 text-sm font-normal": unstyled,
                },
                className
            )}
            {...rest}
        >
            {children}
        </RouterLink>
    );
};

Link.displayName = "Link";
