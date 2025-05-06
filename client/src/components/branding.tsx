import { FC } from "react";

import { cn } from "@/lib/utils";
import Logo from "@/assets/logo.svg";

interface BrandingProps {
    className?: string;
    textSize?: string;
    logoSize?: number;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { textSize = "36px", logoSize = 36, className } = props;

    return (
        <div
            className={cn(
                `font-logo text-logo text-[${textSize}]! inline-flex items-baseline gap-x-2 font-semibold`,
                className
            )}
        >
            <img src={Logo} width={logoSize} />
            <h1 className="p-0">arthveda</h1>
        </div>
    );
};
