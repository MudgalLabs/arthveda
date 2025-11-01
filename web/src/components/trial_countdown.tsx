import { daysBetweenTodayAnd, isDateToday } from "@/lib/utils";
import { cn } from "netra";

export function TrialCountdown({ validUntil }: { validUntil: string }) {
    const daysLeft = daysBetweenTodayAnd(validUntil);
    const message = isDateToday(validUntil) ? "Trial ends today." : `${daysLeft} days left in trial.`;

    return (
        <p
            className={cn("text-accent mt-1 text-xs font-medium", {
                "text-text-destructive": isDateToday(validUntil) || daysLeft <= 7,
            })}
        >
            {message}
        </p>
    );
}
