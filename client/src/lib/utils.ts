import { CurrencyCode } from "@/features/position/position";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateRangeFilter } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isProd(): boolean {
    return process.env.NODE_ENV === "production";
}

export type LocalStorageKey = string;

export const LocalStorageKeySidebarOpen: LocalStorageKey = "sidebar_open";

export function saveToLocalStorage(key: LocalStorageKey, value: string) {
    localStorage.setItem(key, value);
}

export function loadFromLocalStorage<T>(
    key: LocalStorageKey,
    defaultValue?: T
): T | null {
    try {
        const valueStr = localStorage.getItem(key);

        if (valueStr == null) {
            return null;
        }

        const value: T = JSON.parse(valueStr);

        return value;
    } catch (err) {
        console.error("Failed to load from LocalStorage: ", err);
        return defaultValue || null;
    }
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

type AnyObject = Record<string, any>;

export function deepMerge<T extends AnyObject, U extends AnyObject>(
    obj1: T,
    obj2: U
): T & U {
    const result: AnyObject = { ...obj1 };

    for (const key in obj2) {
        if (Object.prototype.hasOwnProperty.call(obj2, key)) {
            const val1 = obj1[key];
            const val2 = obj2[key];

            if (isPlainObject(val1) && isPlainObject(val2)) {
                result[key] = deepMerge(val1, val2);
            } else {
                result[key] = val2;
            }
        }
    }

    return result as T & U;
}

// Helper to check if a value is a plain (non-array, non-null) object
function isPlainObject(value: any): value is AnyObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export function removeAtIndex<T>(array: T[], index: number): T[] {
    if (index < 0 || index >= array.length) return array;
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function formatCurrency(
    amount: string | number,
    currency: CurrencyCode = "inr",
    withSymbol: boolean = true,
    locale: string = "en-IN",
    options: Intl.NumberFormatOptions = {}
): string {
    const _amount = Number(amount);
    const _options = deepMerge(
        {
            style: withSymbol ? "currency" : "decimal",
            currency: currency,
            maximumFractionDigits: 4,
        },
        options
    );

    return new Intl.NumberFormat(locale, _options).format(_amount);
}

export function removeFormatCurrency(formatted: string): string {
    // Remove anything that isn't a digit or a dot
    const cleaned = formatted.replace(/[^0-9.]/g, "");

    return cleaned;
}

export function getCurrencySymbol(
    currencyCode: CurrencyCode,
    locale = "en"
): string {
    const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(1);

    // Remove all digits, commas, periods, and whitespace to isolate the symbol
    const symbol = formatted.replace(/[\d.,\s]/g, "").trim();
    return symbol;
}

let counter = 0;

export function generateId(prefix = "id") {
    const timestamp = Date.now();
    const uniquePart = counter++;
    return `${prefix}-${timestamp}-${uniquePart}`;
}

export function isFunction(value: any): value is Function {
    return typeof value === "function";
}

export function dateRangeFilterToDatesArray(
    filter: DateRangeFilter | undefined
): Date[] {
    if (!filter) return [];

    const dates: Date[] = [];
    const from: Date | undefined = filter?.from;
    const to: Date | undefined = filter?.to;
    if (from) {
        dates.push(from);
    }
    if (to) {
        dates.push(to);
    }
    return dates;
}
