import Decimal from "decimal.js";
import { cn } from "netra";

interface PnLProps {
    value: Decimal;
    children: React.ReactNode;
    className?: string;
}

export function PnL(props: PnLProps) {
    const { value, children, className } = props;

    const isPositive = value.greaterThan(0);
    const isNegative = value.lessThan(0);
    const isEven = value.equals(0);

    return (
        <span
            className={cn(className, {
                "text-success-foreground": isPositive,
                "text-error-foreground": isNegative,
                "text-foreground": isEven,
            })}
        >
            {children}
        </span>
    );
}
