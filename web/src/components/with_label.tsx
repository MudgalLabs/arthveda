import { FC, memo, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface WithLabelProps {
    Label: ReactNode;
    children: ReactNode;
    className?: string;
}

export const WithLabel: FC<WithLabelProps> = memo((props) => {
    const { Label, children, className } = props;

    return (
        <div className={cn("flex flex-col gap-y-2", className)}>
            {Label}
            {children}
        </div>
    );
});
