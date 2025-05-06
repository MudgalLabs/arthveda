import { FC } from "react";

import { cn } from "@/lib/utils";
import Logo from "@/assets/logo.svg";

interface BrandingProps {
    className?: string;
    textSize?: string;
    logoSize?: number;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { textSize = "48px", logoSize = 48, className } = props;

    return (
        <div
            className={cn(
                `font-logo text-logo flex! items-baseline gap-x-3 text-[${textSize}]! font-semibold`,
                className
            )}
        >
            <img src={Logo} width={logoSize} />
            <h1>arthveda</h1>
        </div>
    );
};
