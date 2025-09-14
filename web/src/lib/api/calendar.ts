import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

interface CalendarDailyData {
    pnl: string;
    positions_count: number;
}

interface CalendarMonthlyData {
    year: number; // e.g 2025
    month: number; // e.g 1-12
    pnl: string;
    positions_count: number;
    daily: Record<number, CalendarDailyData>; // Key is day of month (1–31)
}

export interface GetCalendarResponse {
    monthly: Record<string, CalendarMonthlyData>; // Key example "September_2025".
}

export function get() {
    return client.get(API_ROUTES.calendar.get);
}
