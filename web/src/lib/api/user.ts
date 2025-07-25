import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";
import { Subscription } from "@/lib/api/subscription";

export interface User {
    user_id: string;
    email: string;
    name: string;
    avatar_url: string;
    created_at: string;
    update_at: string;

    subscription: Subscription | null;
}

export interface UserMeResponse extends User {}

export function me() {
    return client.get(API_ROUTES.user.me);
}

export function cancelSubscriptionAtPeriodEnd() {
    return client.post(API_ROUTES.user.cancelSubscriptionAtPeriodEnd);
}
