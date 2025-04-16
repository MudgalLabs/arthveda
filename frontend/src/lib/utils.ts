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
