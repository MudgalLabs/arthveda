import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
    children: ReactNode;
    className?: string;
}

function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                "bg-surface-bg border-surface-border rounded-md border-1 p-3",
                className
            )}
        >
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

function CardTitle({ children, className }: CardTitleProps) {
    return (
        <div
            className={cn(
                "text-surface-text text-base font-semibold",
                className
            )}
        >
            {children}
        </div>
    );
}

export { Card, CardTitle };
