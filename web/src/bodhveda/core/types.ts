export interface Target {
    channel: string;
    topic: string;
    event: string;
}

export interface PreferenceTarget extends Target {
    label?: string;
}

export interface PreferenceState {
    enabled: boolean;
    inherited: boolean;
}

export interface Preference {
    target: PreferenceTarget;
    state: PreferenceState;
}

export interface NotificationState {
    opened: boolean;
    read: boolean;
    seen: boolean;
}

export interface Notification {
    id: number;
    recipient_id: string;
    payload: unknown;
    target: Target;
    state: NotificationState;
    broadcast_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface Broadcast {
    id: number;
    payload: unknown;
    target: Target;
    created_at: string;
    updated_at: string;
}

export interface Recipient {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRecipientRequest {
    id: string;
    name?: string;
}

export interface CreateRecipientResponse extends Recipient {}

export interface CreateRecipientsBatchRequest {
    recipients: CreateRecipientRequest[];
}

interface BatchCreateRecipientResultItem {
    id: string;
}

interface BatchCreatereRecicpientResultItemWithError extends BatchCreateRecipientResultItem {
    batch_index: number;
    errors: {
        message: string;
        description: string;
        property_path?: string;
        invalid_value?: unknown;
    }[];
}

export interface CreateRecipientsBatchResponse {
    created: BatchCreateRecipientResultItem[];
    updated: BatchCreateRecipientResultItem[];
    failed: BatchCreatereRecicpientResultItemWithError[];
}

export interface GetRecipientResponse extends Recipient {}

export interface UpdateRecipientRequest {
    name?: string;
}

export interface UpdateRecipientResponse extends Recipient {}

export interface SendNotificationRequest {
    payload: unknown;
    recipient_id?: string;
    target?: Target;
}

export interface SendNotificationResponse {
    notification: Notification | null;
    broadcast: Broadcast | null;
}

export interface ListNotificationsRequest {
    before?: string;
    after?: string;
    limit?: number;
}

export interface ListNotificationsResponse {
    notifications: Notification[];
}

export interface UnreadCountResponse {
    unread_count: number;
}

export interface UpdateNotificationsStateRequest {
    ids: number[];
    state: Partial<NotificationState>;
}

export interface UpdateNotificationsStateResponse {
    updated_count: number;
}

export interface DeleteNotificationsRequest {
    ids: number[];
}

export interface DeleteNotificationsResponse {
    deleted_count: number;
}

export interface ListPreferencesResponse {
    preferences: Preference[];
}

export interface SetPreferenceRequest {
    target: Target;
    state: {
        enabled: boolean;
    };
}

export interface SetPreferenceResponse {
    target: Target;
    state: PreferenceState;
}

export interface CheckPreferenceRequest {
    target: Target;
}

export interface CheckPreferenceResponse {
    target: Target;
    state: PreferenceState;
}
