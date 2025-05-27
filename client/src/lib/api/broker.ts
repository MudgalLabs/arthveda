import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface Broker {
    id: string;
    name: string;
}

export function list() {
    return client.get(API_ROUTES.broker.list);
}
