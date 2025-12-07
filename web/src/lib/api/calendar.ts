import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

interface CalendarDaily {
    pnl: string;
    positions_count: number;
}

interface CalendarWeekly {
    pnl: string;
    positions_count: number;
    week_number: number; // 1-6
}

export interface CalendarMonthly {
    year: number; // e.g 2025
    month: number; // e.g 1-12
    pnl: string;
    positions_count: number;
    daily: Record<number, CalendarDaily>; // Key is day of month (1–31)
    weekly: Record<number, CalendarWeekly>; // Key is week number in month (1–6)
}

interface CalendarYearly {
    pnl: string;
    positions_count: number;
    monthly: Record<string, CalendarMonthly>; // Key is month (e.g., "September")
}

export type GetCalendarResponse = Record<number, CalendarYearly>; // Key is year.

export function get() {
    return client.get(API_ROUTES.calendar.get);
}
