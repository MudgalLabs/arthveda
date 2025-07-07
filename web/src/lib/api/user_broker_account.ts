import { API_ROUTES } from "@/lib/api/api_routes";
import { client } from "@/lib/api/client";

export interface UserBrokerAccount {
    id: string;
    created_at: string;
    updated_at: string | null;
    name: string;
    broker_id: string;
    user_id: string;
    enable_auto_sync: boolean;
    last_sync_at: string | null;
    last_successful_sync_at: string | null;
    last_sync_status: "success" | "failure" | null;
}

export interface CreateUserBrokerAccountPayload {
    name: string;
    broker_id: string;
}

export interface UpdateUserBrokerAccountPayload {
    name: string;
}

export function list() {
    return client.get(API_ROUTES.userBrokerAccount.list);
}

export function create(payload: CreateUserBrokerAccountPayload) {
    return client.post(API_ROUTES.userBrokerAccount.create, payload);
}

export function update(id: string, payload: UpdateUserBrokerAccountPayload) {
    return client.put(API_ROUTES.userBrokerAccount.update(id), payload);
}

export function remove(id: string) {
    return client.delete(API_ROUTES.userBrokerAccount.delete(id));
}
