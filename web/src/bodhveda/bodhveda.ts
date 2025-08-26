import axios, { AxiosError, AxiosInstance } from "axios";
import {
    BodhvedaAPI,
    ListNotificationsResponse,
    ListNotificationsRequest,
    ListPreferencesResponse,
    RecipientsAPI,
    RecipientsNotificationsAPI,
    RecipientsPreferencesAPI,
    SetPreferenceRequest,
    SetPreferenceResponse,
    UnreadCountResponse,
    UpdateNotificationsStateResponse,
    UpdateNotificationsStateRequest,
    DeleteNotificationsRequest,
    DeleteNotificationsResponse,
    CheckPreferenceRequest,
    CheckPreferenceResponse,
} from "@/bodhveda/types";
import { ROUTES } from "./routes";
import { ApiRes } from "@/lib/api/client";

interface BodhvedaOptions {
    apiURL?: string;
}

export class Bodhveda implements BodhvedaAPI {
    recipients: RecipientsAPI;

    constructor(apiKey: string, options: BodhvedaOptions = {}) {
        const { apiURL = "https://api.bodhveda.com" } = options;

        const client = axios.create({
            baseURL: apiURL,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        });

        client.interceptors.response.use(
            (response) => response.data, // Unwrap the main data object from the response.
            (error: AxiosError) => {
                console.log("ASDDD", error);
                if (axios.isAxiosError(error) && error.response?.data) {
                    throw error.response?.data as ApiRes; // Throw the API's error response directly.
                } else {
                    throw error;
                }
            }
        );

        this.recipients = new Recipients(client);
    }
}

class Recipients implements RecipientsAPI {
    client: AxiosInstance;
    notifications: RecipientsNotificationsAPI;
    preferences: RecipientsPreferencesAPI;

    constructor(client: AxiosInstance) {
        this.client = client;
        this.notifications = new RecipientsNotifications(client);
        this.preferences = new RecipientsPreferences(client);
    }
}

class RecipientsNotifications implements RecipientsNotificationsAPI {
    client: AxiosInstance;

    constructor(client: AxiosInstance) {
        this.client = client;
    }

    async list(recipientID: string, req?: ListNotificationsRequest): Promise<ListNotificationsResponse> {
        const response = await this.client.get(ROUTES.recipients.notifications.list(recipientID), {
            params: req,
        });
        return response.data as ListNotificationsResponse;
    }

    async unreadCount(recipientID: string): Promise<UnreadCountResponse> {
        const response = await this.client.get(ROUTES.recipients.notifications.unreadCount(recipientID));
        return response.data as UnreadCountResponse;
    }

    async updateState(
        recipientID: string,
        req: UpdateNotificationsStateRequest
    ): Promise<UpdateNotificationsStateResponse> {
        const response = await this.client.patch(ROUTES.recipients.notifications.udpateState(recipientID), req);
        return response.data as UpdateNotificationsStateResponse;
    }

    async delete(recipientID: string, req: DeleteNotificationsRequest): Promise<DeleteNotificationsResponse> {
        const response = await this.client.delete(ROUTES.recipients.notifications.delete(recipientID), {
            data: req,
        });
        return response.data as DeleteNotificationsResponse;
    }
}

class RecipientsPreferences implements RecipientsPreferencesAPI {
    client: AxiosInstance;

    constructor(client: AxiosInstance) {
        this.client = client;
    }

    async list(recipientID: string): Promise<ListPreferencesResponse> {
        const response = await this.client.get(ROUTES.recipients.preferences.list(recipientID));
        return response.data as ListPreferencesResponse;
    }

    async set(recipientID: string, req: SetPreferenceRequest): Promise<SetPreferenceResponse> {
        const response = await this.client.patch(ROUTES.recipients.preferences.set(recipientID), {
            target: req.target,
            state: req.state,
        });
        return response.data as SetPreferenceResponse;
    }

    async check(recipientID: string, req: CheckPreferenceRequest): Promise<CheckPreferenceResponse> {
        const response = await this.client.get(ROUTES.recipients.preferences.check(recipientID), {
            params: req.target,
        });
        return response.data as CheckPreferenceResponse;
    }
}
