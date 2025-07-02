import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface SymbolSearchRequest {
    query: string;
}

export type SymbolSearchResponse = string[];

export function search(body: SymbolSearchRequest) {
    return client.post(API_ROUTES.symbol.search, body);
}
