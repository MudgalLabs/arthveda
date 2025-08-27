import { useContext } from "react";
import {
    AnyUseMutationOptions,
    AnyUseQueryOptions,
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";

import {
    ListNotificationsResponse,
    ListPreferencesResponse,
    UpdateNotificationsStateRequest,
    UpdateNotificationsStateResponse,
    SetPreferenceRequest,
    SetPreferenceResponse,
    DeleteNotificationsResponse,
    DeleteNotificationsRequest,
    Target,
    CheckPreferenceResponse,
} from "@/bodhveda/core/types";
import { BodhvedaContext } from "@/bodhveda/react/context";

type QueryOptions = Omit<AnyUseQueryOptions, "queryKey">;
type MutationOptions = AnyUseMutationOptions;

const QUERY_KEYS = {
    useNotifications: ["useNotifications"],
    useNotificationsUnreadCount: ["useNotificationsUnreadCount"],
    useCheckPreference: ["useCheckPreference"],
    usePreferences: ["usePreferences"],
};

export function useBodhveda() {
    const context = useContext(BodhvedaContext);

    if (!context) {
        throw new Error("useBodhveda: did you forget to use BodhvedaProvider?");
    }

    return context.bodhveda;
}

export function useRecipientID() {
    const context = useContext(BodhvedaContext);

    if (!context) {
        throw new Error("useBodhveda: did you forget to use BodhvedaProvider?");
    }

    return context.recipientID;
}

export function useNotifications(options: QueryOptions = {}): UseQueryResult<ListNotificationsResponse> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useNotifications],
        queryFn: () => bodhveda.recipients.notifications.list(recipientID),
        ...options,
    });
}

export function useNotificationsUnreadCount(options: QueryOptions = {}): UseQueryResult<{ unread_count: number }> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useNotificationsUnreadCount],
        queryFn: () => bodhveda.recipients.notifications.unreadCount(recipientID),
        ...options,
    });
}

export function useUpdateNotificationsState(options: MutationOptions = {}) {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;

    return useMutation<UpdateNotificationsStateResponse, unknown, UpdateNotificationsStateRequest, unknown>({
        mutationFn: (req) => {
            return bodhveda.recipients.notifications.updateState(recipientID, req);
        },
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useNotifications] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useNotificationsUnreadCount] });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useDeleteNotifications(options: MutationOptions = {}) {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;

    return useMutation<DeleteNotificationsResponse, unknown, DeleteNotificationsRequest, unknown>({
        mutationFn: (req) => {
            return bodhveda.recipients.notifications.delete(recipientID, req);
        },
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useNotifications] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useNotificationsUnreadCount] });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function usePreferences(options: QueryOptions = {}): UseQueryResult<ListPreferencesResponse> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.usePreferences],
        queryFn: () => bodhveda.recipients.preferences.list(recipientID),
        ...options,
    });
}

export function useUpdatePreference(options: MutationOptions = {}) {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;

    return useMutation<SetPreferenceResponse, unknown, SetPreferenceRequest, unknown>({
        mutationFn: (req: SetPreferenceRequest) => {
            return bodhveda.recipients.preferences.set(recipientID, req);
        },
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.usePreferences] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useCheckPreference, args[0].target] });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useCheckPreference(
    target: Target,
    options: QueryOptions = {}
): UseQueryResult<CheckPreferenceResponse> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useCheckPreference, target],
        queryFn: () => bodhveda.recipients.preferences.check(recipientID, { target }),
        ...options,
    });
}
