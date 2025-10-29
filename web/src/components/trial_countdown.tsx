import { daysBetweenTodayAnd, isDateToday } from "@/lib/utils";

export function TrialCountdown({ validUntil }: { validUntil: string }) {
    const daysLeft = daysBetweenTodayAnd(validUntil);
    let message = "";
    let className = "text-xs mt-1 text-accent font-medium";

    if (daysLeft > 7) {
        message = `${daysLeft} days left in trial`;
    } else if (daysLeft > 0) {
        message = `Last ${daysLeft} day${daysLeft === 1 ? "" : "s"} of your trial`;
        className += " text-accent font-semibold";
    } else if (isDateToday(validUntil)) {
        message = "Trial ends today";
        className += " text-destructive font-semibold";
    }

    if (!message) return null;

    return <p className={className}>{message}</p>;
}
