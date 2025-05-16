import { FC } from "react";

import { cn } from "@/lib/utils";
import Logo from "@/assets/logo.svg";

interface BrandingProps {
    size?: "small" | "default" | "large";
    className?: string;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { className, size = "default" } = props;

    const classes = {
        small: {
            logo: "h-[24px]",
            text: "text-[26px]",
        },
        default: {
            logo: "h-[36px]",
            text: "text-[40px]",
        },
        large: {
            logo: "h-48px",
            text: "text-[52px]",
        },
    };

    return (
        <div
            className={cn(
                "font-logo text-logo inline-flex items-baseline gap-x-2 font-semibold select-none",
                className
            )}
        >
            <img src={Logo} className={classes[size].logo} />
            <h1 className={"p-0 " + classes[size].text}>arthveda</h1>
        </div>
    );
};
