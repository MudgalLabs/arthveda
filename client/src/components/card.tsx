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
                "border-border-muted rounded-md border-1 p-6",
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
        <div className={cn("text-base font-semibold", className)}>
            {children}
        </div>
    );
}

export { Card, CardTitle };
