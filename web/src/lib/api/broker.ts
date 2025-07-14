import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

// NOTE: All the supported brokers should be listed here.
export type BrokerName = "Groww" | "Upstox" | "Zerodha";

export interface Broker {
    id: string;
    name: string;
    supports_file_import: boolean;
    supports_trade_sync: boolean;
}

export function list() {
    return client.get(API_ROUTES.broker.list);
}
