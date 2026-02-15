import { Position } from "@/features/position/position";
import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { DecimalString } from "@/lib/types";

interface CalendarDaily {
    gross_pnl: string;
    charges: string;
    net_pnl: string;
    gross_r_factor: string;
    positions_count: number;
    position_ids: string[];
}

export interface CalendarWeekly {
    gross_pnl: string;
    net_pnl: string;
    gross_r_factor: string;
    positions_count: number;
    week_number: number; // 1-6
}

export interface CalendarMonthly {
    year: number; // e.g 2025
    month: number; // e.g 1-12
    gross_pnl: string;
    net_pnl: string;
    gross_r_factor: string;
    positions_count: number;
    daily: Record<number, CalendarDaily>; // Key is day of month (1–31)
    weekly: Record<number, CalendarWeekly>; // Key is week number in month (1–6)
}

interface CalendarYearly {
    gross_pnl: string;
    net_pnl: string;
    gross_r_factor: string;
    positions_count: number;
    monthly: Record<string, CalendarMonthly>; // Key is month (e.g., "September")
}

export type GetCalendarAllResponse = Record<number, CalendarYearly>; // Key is year.

export function getAll() {
    return client.get(API_ROUTES.calendar.getAll);
}

export interface GetCalendarDayResponse {
    date: string;
    gross_pnl: DecimalString;
    net_pnl: DecimalString;
    charges: DecimalString;
    gross_r_factor: DecimalString;
    net_r_factor: DecimalString;
    positions: Position[];
}

export function getDay(date: Date) {
    return client.get(API_ROUTES.calendar.getDay, { params: { date } });
}
