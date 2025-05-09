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

export function formatDate(date: Date) {
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

    return `${month} ${getOrdinalSuffix(day)}, ${year}`;
}
