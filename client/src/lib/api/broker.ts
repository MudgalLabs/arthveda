import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

// NOTE: All the supported brokers should be listed here.
export type BrokerName = "Zerodha" | "Groww";

export interface Broker {
    id: string;
    name: string;
}

export function list() {
    return client.get(API_ROUTES.broker.list);
}
