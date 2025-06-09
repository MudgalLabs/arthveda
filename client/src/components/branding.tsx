import { FC } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

interface BrandingProps {
    className?: string;
    size?: "small" | "default" | "large";
    hideText?: boolean;
    hideLogo?: boolean;
}

export const Branding: FC<BrandingProps> = (props) => {
    const {
        className,
        size = "default",
        hideLogo = false,
        hideText = false,
    } = props;

    const classes = {
        small: {
            logo: 24,
            text: "text-[26px]",
        },
        default: {
            logo: 36,
            text: "text-[40px]",
        },
        large: {
            logo: 48,
            text: "text-[52px]",
        },
    };

    return (
        <div
            className={cn(
                "font-logo text-primary inline-flex items-baseline gap-x-2 font-semibold select-none",
                className
            )}
        >
            {!hideLogo && <Logo size={classes[size].logo} />}
            {!hideText && (
                <h1 className={cn("leading-0!", classes[size].text)}>
                    arthveda
                </h1>
            )}
        </div>
    );
};
