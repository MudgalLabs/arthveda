import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

// We currently support only INR.
export type CurrencyCode = "INR" | "USD";

export interface Currency {
    code: CurrencyCode;
    name: string;
}

export function list() {
    return client.get(API_ROUTES.currency.list);
}
