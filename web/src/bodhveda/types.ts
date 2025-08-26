export interface Target {
    channel: string;
    topic: string;
    event: string;
}

interface PreferenceTarget extends Target {
    label?: string;
}

interface PreferenceState {
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
    created_at: string;
    updated_at: string;
}

export interface BodhvedaAPI {
    recipients: RecipientsAPI;
}

export interface RecipientsAPI {
    preferences: RecipientsPreferencesAPI;
    notifications: RecipientsNotificationsAPI;
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

export interface RecipientsNotificationsAPI {
    list(recipientID: string, req?: ListNotificationsRequest): Promise<ListNotificationsResponse>;
    unreadCount(recipientID: string): Promise<UnreadCountResponse>;
    updateState(recipientID: string, req: UpdateNotificationsStateRequest): Promise<UpdateNotificationsStateResponse>;
    delete(recipientID: string, req: DeleteNotificationsRequest): Promise<DeleteNotificationsResponse>;
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

export interface RecipientsPreferencesAPI {
    list(recipientID: string): Promise<ListPreferencesResponse>;
    set(recipientID: string, req: SetPreferenceRequest): Promise<SetPreferenceResponse>;
    check(recipientID: string, req: CheckPreferenceRequest): Promise<CheckPreferenceResponse>;
}
