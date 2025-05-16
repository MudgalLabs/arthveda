import { FC } from "react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const loadingVariant = cva(
    ["animate-spin rounded-full border-[inherit] border-b-transparent"],
    {
        variants: {
            size: {
                default: ["h-6 w-6 border-3"],
                small: ["h-4 w-4 border-2"],
                large: ["h-8 w-8 border-4"],
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
);

interface LoadingProps extends VariantProps<typeof loadingVariant> {
    color?: string;
}

export const Loading: FC<LoadingProps> = ({ color, size = "default" }) => {
    let borderColor = "border-primary";

    if (color) {
        if (color.startsWith("--")) {
            borderColor = `border-(${color})`;
        } else {
            borderColor = `border-[${color}]`;
        }
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className={borderColor}>
                <div
                    className={cn(
                        "animate-spin rounded-full border-[inherit] border-b-transparent",
                        loadingVariant({ size })
                    )}
                />
            </div>
        </div>
    );
};
