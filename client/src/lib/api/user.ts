import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface User {
    created_at: string;
    display_image: string;
    display_name: string;
    email: string;
    update_at: string;
    user_id: number;
}

export function me() {
    return client.get(API_ROUTES.user.me);
}
