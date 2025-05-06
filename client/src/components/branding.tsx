import { FC } from "react";

import Logo from "../assets/logo.svg";
import { cn } from "@/lib/utils";

interface BrandingProps {
    className?: string;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { className } = props;

    return (
        <div
            className={cn(
                "font-logo text-primary-500 flex! items-baseline gap-x-3 text-[52px] font-semibold",
                className
            )}
        >
            <img src={Logo} />
            <h1>arthveda</h1>
        </div>
    );
};
