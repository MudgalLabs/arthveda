import Decimal from "decimal.js";
import { cn } from "netra";

interface PnLProps {
    value: Decimal;
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "positive" | "negative";
}

export function PnL(props: PnLProps) {
    const { value, children, className, variant } = props;

    const isPositive = value.greaterThan(0) || value.equals(0);
    const isNegative = value.lessThan(0);

    let colorClass = "";

    if (isPositive) {
        colorClass = "text-success-foreground-2";
    } else if (isNegative) {
        colorClass = "text-text-destructive-2";
    } else {
        colorClass = "text-foreground";
    }

    if (variant) {
        if (variant === "positive") {
            colorClass = "text-success-foreground";
        } else if (variant === "negative") {
            colorClass = "text-text-destructive";
        } else if (variant === "default") {
            colorClass = "text-foreground";
        }
    }

    return <span className={cn("whitespace-nowrap tabular-nums", className, colorClass)}>{children}</span>;
}
