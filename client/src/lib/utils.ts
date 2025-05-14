import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isProd(): boolean {
    return process.env.NODE_ENV === "production";
}

export enum LocalStorageKey {
    SIDEBAR_OPEN = "sidebar_open",
}

export function saveToLocalStorage(key: LocalStorageKey, value: string) {
    localStorage.setItem(key, value);
}

export function loadFromLocalStorage(key: LocalStorageKey): string {
    return localStorage.getItem(key) || "";
}

interface formatDateOptions {
    time?: boolean;
}

export function formatDate(date: Date, options: formatDateOptions = {}) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const day = date.getDate();
    const year = date.getFullYear();
    const month = months[date.getMonth()];

    const getOrdinalSuffix = (n: number) => {
        if (n >= 11 && n <= 13) return n + "th";
        switch (n % 10) {
            case 1:
                return n + "st";
            case 2:
                return n + "nd";
            case 3:
                return n + "rd";
            default:
                return n + "th";
        }
    };

    const formattedDate = `${month} ${getOrdinalSuffix(day)}, ${year}`;

    if (options.time) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${formattedDate}, ${hours}:${minutes}`;
    }

    return formattedDate;
}

/**
 * Rounds a Date object to the nearest 15-minute increment.
 * Adjusts the hour if needed and resets seconds and milliseconds.
 *
 * @param date - A Date instance to be rounded.
 * @returns A new Date object rounded to the nearest 15 minutes.
 */
export function roundToNearest15Minutes(date: Date): Date {
    const result = new Date(date); // Clone original to avoid mutation

    const minutes: number = result.getMinutes();
    const roundedMinutes: number = Math.round(minutes / 15) * 15;

    if (roundedMinutes === 60) {
        result.setHours(result.getHours() + 1);
        result.setMinutes(0);
    } else {
        result.setMinutes(roundedMinutes);
    }

    result.setSeconds(0);
    result.setMilliseconds(0);

    return result;
}

/**
 * Represents the time difference between two dates in days, hours, and minutes.
 */
interface TimeElapsed {
    days: number;
    hours: number;
    minutes: number;
}

/**
 * Calculates the time elapsed between two Date objects and returns the breakdown
 * in days, hours, and minutes (not total values).
 */
export function getElapsedTime(start: Date, end: Date): TimeElapsed {
    if (start > end) {
        console.error(
            "getElapsedTime: start date must be earlier than end date."
        );
        return { days: 0, hours: 0, minutes: 0 };
    }

    const diffMs: number = end.getTime() - start.getTime();
    const totalMinutes: number = Math.floor(diffMs / (1000 * 60));

    const days: number = Math.floor(totalMinutes / (60 * 24));
    const hours: number = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes: number = totalMinutes % 60;

    return { days, hours, minutes };
}
