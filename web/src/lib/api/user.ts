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

    subscription: Subscription | null;
    positions_hidden: number;
    total_positions: number;
    upload_bytes_used: number;
    upload_bytes_limit: number;
}

export interface UserMeResponse extends User {}

export function me() {
    return client.get(API_ROUTES.user.me);
}
