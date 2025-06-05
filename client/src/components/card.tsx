import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
    children: ReactNode;
    className?: string;
}

function Card({ children, className }: CardProps) {
    return (
        <div
            data-slow="card"
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
            data-slow="card-title"
            className={cn("text-surface-foreground font-medium", className)}
        >
            {children}
        </div>
    );
}

function CardContent({ children, className }: CardProps) {
    return (
        <div
            data-slot="card-content"
            className={cn("text-foreground text-sm", className)}
        >
            {children}
        </div>
    );
}

export { Card, CardTitle, CardContent };
