import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export function refresh(refreshToken: string) {
    return client.get(API_ROUTES.auth.refresh, {
        params: {
            refresh_token: refreshToken,
        },
    });
}
