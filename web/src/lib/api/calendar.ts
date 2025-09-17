import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

interface CalendarDaily {
    pnl: string;
    positions_count: number;
}

export interface CalendarMonthly {
    year: number; // e.g 2025
    month: number; // e.g 1-12
    pnl: string;
    positions_count: number;
    daily: Record<number, CalendarDaily>; // Key is day of month (1–31)
}

type CalendarYearly = Record<string, CalendarMonthly>; // Key is month (e.g., "September")

export type GetCalendarResponse = Record<number, CalendarYearly>; // Key is year.

export function get() {
    return client.get(API_ROUTES.calendar.get);
}
