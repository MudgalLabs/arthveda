import { cn } from "@/lib/utils";
import { FC } from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

interface LinkProps extends RouterLinkProps {
    variant?: "default" | "unstyled";
}

export const Link: FC<LinkProps> = (props) => {
    const { children, className, variant, ...rest } = props;

    return (
        <RouterLink
            className={cn(
                {
                    "cursor-default! text-base! font-normal! text-inherit! no-underline!": variant === "unstyled",
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
