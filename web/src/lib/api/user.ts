import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { Subscription } from "@/lib/api/subscription";
import { CurrencyCode } from "@/lib/api/currency";

export interface User {
    user_id: string;
    email: string;
    name: string;
    avatar_url: string;
    home_currency_code: CurrencyCode;
    created_at: string;
    update_at: string;
}

export interface UserMeResponse extends User {
    subscription: Subscription | null;
    positions_hidden: number;
    total_positions: number;
    upload_bytes_used: number;
    upload_bytes_limit: number;
    onboarded: boolean;
}

export function me() {
    return client.get(API_ROUTES.user.me);
}

export function markAsOnboarded() {
    return client.post(API_ROUTES.user.markAsOnboarded);
}

export interface CanUpdateHomeCurrnecyResponse {
    can_update: boolean;
}

export function canUpdateHomeCurrency() {
    return client.get(API_ROUTES.user.canUpdateHomeCurrency);
}

export function updateHomeCurrency(newCurrencyCode: CurrencyCode) {
    return client.patch(API_ROUTES.user.updateHomeCurrency, {
        new_currency_code: newCurrencyCode,
    });
}
