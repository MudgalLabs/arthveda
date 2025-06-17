import qs from "qs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { DateRangeFilter } from "@/lib/types";
import { CurrencyCode } from "@/features/position/position";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isProd(): boolean {
    return process.env.NODE_ENV === "production";
}

export type LocalStorageKey = string;

export const LocalStorageKeyDashboardLayout: LocalStorageKey = "dashboard_layout";
export const LocalStorageKeySidebarOpen: LocalStorageKey = "sidebar_open";
export const LocalStorageKeyCumulativePnLShowGross: LocalStorageKey = "cumulative_pnl_show_gross";
export const LocalStorageKeyCumulativePnLShowCharges: LocalStorageKey = "cumulative_pnl_show_charges";

export function saveToLocalStorage(key: LocalStorageKey, value: string) {
    localStorage.setItem(key, value);
}

export function loadFromLocalStorage<T>(key: LocalStorageKey): T | null {
    try {
        const valueStr = localStorage.getItem(key);

        if (valueStr == null) {
            return null;
        }

        const value: T = JSON.parse(valueStr);

        return value;
    } catch (err) {
        console.error("Failed to load from LocalStorage: ", err);
        return null;
    }
}

interface formatDateOptions {
    time?: boolean;
}

export function formatDate(date: Date, options: formatDateOptions = {}) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
        console.error("getElapsedTime: start date must be earlier than end date.");
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

export function deepMerge<T extends AnyObject, U extends AnyObject>(obj1: T, obj2: U): T & U {
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
    {
        currency = "inr",
        hideSymbol = false,
        locale = "en-IN",
        localizationOpts = {},
        compact = false,
    }: {
        currency?: CurrencyCode;
        hideSymbol?: boolean;
        locale?: string;
        localizationOpts?: Intl.NumberFormatOptions;
        compact?: boolean;
    } = {}
): string {
    const _amount = Number(amount);

    if (compact) {
        const absAmount = Math.abs(_amount);
        let formatted = "";

        if (absAmount >= 1_00_00_000) {
            formatted = `${(_amount / 1_00_00_000).toFixed(2)}Cr`; // Crores
        } else if (absAmount >= 1_00_000) {
            formatted = `${(_amount / 1_00_000).toFixed(2)}L`; // Lakhs
        } else if (absAmount >= 1_000) {
            formatted = `${(_amount / 1_000).toFixed(2)}k`; // Thousands
        } else {
            formatted = _amount.toFixed(2); // Default formatting for smaller values
        }

        return hideSymbol ? formatted : `${getCurrencySymbol(currency)}${formatted}`;
    }

    const options = deepMerge(
        {
            style: hideSymbol ? "decimal" : "currency",
            currency: currency,
            maximumFractionDigits: 2,
        },
        localizationOpts
    );

    return new Intl.NumberFormat(locale, options).format(_amount);
}

export function removeFormatCurrency(formatted: string): string {
    // Remove anything that isn't a digit or a dot
    const cleaned = formatted.replace(/[^0-9.]/g, "");

    return cleaned;
}

export function getCurrencySymbol(currencyCode: CurrencyCode, locale = "en"): string {
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

export function datesArrayToDateRangeFilter(dates: Date[]): DateRangeFilter {
    if (!dates || dates.length === 0) return {};

    const from = dates[0];
    const to = dates[1];

    if (from && to) {
        return { from, to };
    } else if (from) {
        return { from };
    } else if (to) {
        return { to };
    }

    return {};
}

export function dateRangeFilterToDatesArray(filter: DateRangeFilter | undefined): Date[] {
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

export function loadFromURL<T>(key: string, defaultValue?: T, customParsers?: LoadFromURLParser): T {
    const raw = qs.parse(location.search, {
        ignoreQueryPrefix: true,
        allowDots: true,
    })[key] as T;
    const parsedQuery = deepParseObject<T>(raw, customParsers);

    if (raw === "" || raw === undefined || parsedQuery === "" || parsedQuery === undefined) {
        // No value in URL, return default value.
        return defaultValue as T;
    }

    if (Object.keys(parsedQuery as object).length === 0 && parsedQuery !== undefined) {
        // We found a value in URL, but it's not an object (e.g., empty string).
        return parsedQuery as T;
    }

    if (Object.keys(parsedQuery as object).length > 0) {
        // Parsed query is an object with keys, return it.
        return { ...defaultValue, ...parsedQuery };
    }

    // Fallback to default value if nothing else matches.
    return defaultValue as T;
}

export function saveToURL<T>(key: string, value: T) {
    const currentQuery = qs.parse(location.search, {
        ignoreQueryPrefix: true,
        allowDots: true,
    });

    const updatedQuery = {
        ...currentQuery,
        [key]: value,
    };

    const queryString = qs.stringify(updatedQuery, {
        encodeValuesOnly: true,
        skipNulls: true,
        allowDots: true,
    });

    const newUrl = `${window.location.pathname}?${queryString}`;
    window.history.replaceState(null, "", newUrl);
}

export type LoadFromURLParser = {
    [key: string]: (value: any) => any;
};

function deepParseObject<T>(input: T, customParsers?: LoadFromURLParser, path: string = ""): T {
    if (Array.isArray(input)) {
        return input.map((item, idx) => deepParseObject(item, customParsers, `${path}[${idx}]`)) as any;
    }

    if (input && typeof input === "object" && !(input instanceof Date)) {
        const result: any = {};
        for (const key in input) {
            const fullPath = path ? `${path}.${key}` : key;
            const value = (input as any)[key];
            result[key] = deepParseObject(value, customParsers, fullPath);
        }
        return result;
    }

    // String leaf node — apply built-in parsing
    if (typeof input === "string") {
        // Custom parser takes precedence
        if (customParsers?.[path]) {
            return customParsers[path](input);
        }

        // Date ISO check
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
            const date = new Date(input) as any;
            return isNaN(date.getTime()) ? input : date;
        }

        // Number check — skip empty strings
        if (input.trim() !== "" && !isNaN(Number(input))) {
            return Number(input) as any;
        }

        // Boolean check
        if (input === "true") return true as any;
        if (input === "false") return false as any;
    }

    return input;
}
