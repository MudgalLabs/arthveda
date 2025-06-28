import { FC } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Tag, Tooltip } from "@/s8ly";

interface BrandingProps {
    className?: string;
    size?: "small" | "default" | "large";
    hideText?: boolean;
    hideLogo?: boolean;
    hideBetaTag?: boolean;
}

export const Branding: FC<BrandingProps> = (props) => {
    const { className, size = "default", hideLogo = false, hideText = false, hideBetaTag = false } = props;

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
        <Tooltip
            disabled={hideBetaTag}
            contentProps={{
                sideOffset: 8,
                align: "center",
                // className: "max-w-[300px] text-balance",
            }}
            content={
                <p onClick={(e) => e.stopPropagation()} className="">
                    Arthveda is in Beta. Please help us make it better by reporting issues or suggesting features on{" "}
                    <a href="https://github.com/MudgalLabs/arthveda" target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>{" "}
                    <br />
                    or by writing to us{" "}
                    <a href="mailto:hey@arthveda.app" className="">
                        hey@arthveda.app
                    </a>
                    .
                </p>
            }
        >
            <div className="flex-center items-start gap-x-1">
                <div
                    className={cn(
                        "font-logo text-muted-foreground inline-flex items-baseline gap-x-2 font-semibold select-none",
                        className
                    )}
                >
                    {!hideLogo && <Logo size={classes[size].logo} />}

                    {!hideText && <h1 className={cn("leading-0!", classes[size].text)}>arthveda</h1>}
                </div>

                {!hideBetaTag && (
                    <Tag variant="primary" size="small">
                        BETA
                    </Tag>
                )}
            </div>
        </Tooltip>
    );
};
