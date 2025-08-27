import axios, { AxiosError, AxiosInstance } from "axios";

import {
    ListNotificationsResponse,
    ListNotificationsRequest,
    ListPreferencesResponse,
    SetPreferenceRequest,
    SetPreferenceResponse,
    UnreadCountResponse,
    UpdateNotificationsStateResponse,
    UpdateNotificationsStateRequest,
    DeleteNotificationsRequest,
    DeleteNotificationsResponse,
    CheckPreferenceRequest,
    CheckPreferenceResponse,
    SendNotificationRequest,
    SendNotificationResponse,
    CreateRecipientRequest,
    CreateRecipientResponse,
    CreateRecipientsBatchRequest,
    CreateRecipientsBatchResponse,
    GetRecipientResponse,
    UpdateRecipientRequest,
    UpdateRecipientResponse,
} from "@/bodhveda/core/types";
import { ROUTES } from "@/bodhveda/core/routes";

interface BodhvedaOptions {
    apiURL?: string;
}

interface BodhvedaAPI {
    notifications: NotificationsAPI;
    recipients: RecipientsAPI;
}

export class Bodhveda implements BodhvedaAPI {
    notifications: NotificationsAPI;
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
                if (axios.isAxiosError(error) && error.response?.data) {
                    throw error.response?.data; // Throw the API's error response directly.
                } else {
                    throw error;
                }
            }
        );

        this.notifications = new Notifications(client);
        this.recipients = new Recipients(client);
    }
}

interface NotificationsAPI {
    send: (req: SendNotificationRequest) => Promise<SendNotificationResponse>;
}

class Notifications implements NotificationsAPI {
    client: AxiosInstance;

    constructor(client: AxiosInstance) {
        this.client = client;
    }

    async send(req: SendNotificationRequest): Promise<SendNotificationResponse> {
        const response = await this.client.post(ROUTES.notifications.send, req);
        return response.data as SendNotificationResponse;
    }
}

interface RecipientsAPI {
    create: (req: CreateRecipientRequest) => Promise<CreateRecipientResponse>;
    createBatch: (req: CreateRecipientsBatchRequest) => Promise<CreateRecipientsBatchResponse>;
    get: (recipientID: string) => Promise<GetRecipientResponse>;
    update: (recipientID: string, req: UpdateRecipientRequest) => Promise<UpdateRecipientResponse>;
    delete: (recipientID: string) => Promise<void>;

    preferences: RecipientsPreferencesAPI;
    notifications: RecipientsNotificationsAPI;
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

    async create(req: CreateRecipientRequest): Promise<CreateRecipientResponse> {
        const response = await this.client.post(ROUTES.recipients.create, req);
        return response.data as CreateRecipientResponse;
    }

    async createBatch(req: CreateRecipientsBatchRequest): Promise<CreateRecipientsBatchResponse> {
        const response = await this.client.post(ROUTES.recipients.createBatch, req);
        return response.data as CreateRecipientsBatchResponse;
    }

    async get(recipientID: string): Promise<GetRecipientResponse> {
        const response = await this.client.get(ROUTES.recipients.get(recipientID));
        return response.data as GetRecipientResponse;
    }

    async update(recipientID: string, req: UpdateRecipientRequest): Promise<UpdateRecipientResponse> {
        const response = await this.client.patch(ROUTES.recipients.update(recipientID), req);
        return response.data as UpdateRecipientResponse;
    }

    async delete(recipientID: string): Promise<void> {
        await this.client.delete(ROUTES.recipients.delete(recipientID));
    }
}

interface RecipientsNotificationsAPI {
    list(recipientID: string, req?: ListNotificationsRequest): Promise<ListNotificationsResponse>;
    unreadCount(recipientID: string): Promise<UnreadCountResponse>;
    updateState(recipientID: string, req: UpdateNotificationsStateRequest): Promise<UpdateNotificationsStateResponse>;
    delete(recipientID: string, req: DeleteNotificationsRequest): Promise<DeleteNotificationsResponse>;
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

interface RecipientsPreferencesAPI {
    list(recipientID: string): Promise<ListPreferencesResponse>;
    set(recipientID: string, req: SetPreferenceRequest): Promise<SetPreferenceResponse>;
    check(recipientID: string, req: CheckPreferenceRequest): Promise<CheckPreferenceResponse>;
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
