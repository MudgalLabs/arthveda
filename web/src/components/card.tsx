import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

function Card({ children, className, ...props }: CardProps) {
    return (
        <div
            data-slow="card"
            className={cn(
                "bg-surface-bg border-surface-border rounded-md border-1 p-3",
                // "hover:border-accent smooth-colors",
                className
            )}
            {...props}
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
        <div data-slow="card-title" className={cn("text-foreground font-medium", className)}>
            {children}
        </div>
    );
}

function CardContent({ children, className }: CardProps) {
    return (
        <div data-slot="card-content" className={cn("text-muted-foreground text-sm", className)}>
            {children}
        </div>
    );
}

export { Card, CardTitle, CardContent };
