import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface User {
    id: number;
    email: string;
    display_name: string;
    display_image: string;
    created_at: string;
    update_at: string;
}

export function me() {
    return client.get(API_ROUTES.user.me);
}
