import { API_ROUTES } from "@/lib/api/api-routes";
import { client } from "@/lib/api/client";

export function getMe() {
    return client.get(API_ROUTES.user.getMe);
}
