import { FC } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

interface BrandingProps {
    size?: "small" | "default" | "large";
    className?: string;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { className, size = "default" } = props;

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
            <Logo size={classes[size].logo} />
            <h1 className={" " + classes[size].text}>arthveda</h1>
        </div>
    );
};
