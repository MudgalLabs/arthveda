import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface User {
    user_id: number;
    email: string;
    name: string;
    avatar_url: string;
    created_at: string;
    update_at: string;
}

export interface UserMeResponse extends User {}

export function me() {
    return client.get(API_ROUTES.user.me);
}
