import { createContext, useContext } from "react";
import {
    AnyUseMutationOptions,
    AnyUseQueryOptions,
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";

import {
    BodhvedaAPI,
    ListNotificationsResponse,
    ListPreferencesResponse,
    UpdateNotificationsStateRequest,
    UpdateNotificationsStateResponse,
    SetPreferenceRequest,
    SetPreferenceResponse,
    DeleteNotificationsResponse,
    DeleteNotificationsRequest,
    Target,
} from "@/bodhveda/types";

type QueryOptions = Omit<AnyUseQueryOptions, "queryKey">;
type MutationOptions = AnyUseMutationOptions;

const QUERY_KEYS = {
    useListNotifications: ["useListNotifications"],
    useUnreadCount: ["useUnreadCount"],
    useListPreferences: ["useListPreferences"],
};

interface BodhvedaContextType {
    bodhveda: BodhvedaAPI;
    recipientID: string;
}

const BodhvedaContext = createContext<BodhvedaContextType | null>(null);

export function BodhvedaProvider({
    children,
    bodhveda,
    recipientID,
}: {
    children: React.ReactNode;
    bodhveda: BodhvedaAPI;
    recipientID: string;
}) {
    return <BodhvedaContext.Provider value={{ bodhveda, recipientID }}>{children}</BodhvedaContext.Provider>;
}

export function useBodhveda() {
    const context = useContext(BodhvedaContext);

    if (!context) {
        throw new Error("useBodhveda: did you forget to use BodhvedaProvider?");
    }

    return context.bodhveda;
}

function useRecipientID() {
    const context = useContext(BodhvedaContext);

    if (!context) {
        throw new Error("useBodhveda: did you forget to use BodhvedaProvider?");
    }

    return context.recipientID;
}

export function useListNotifications(options: QueryOptions = {}): UseQueryResult<ListNotificationsResponse> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useListNotifications],
        queryFn: () => bodhveda.recipients.notifications.list(recipientID),
        ...options,
    });
}

export function useUnreadCount(options: QueryOptions = {}): UseQueryResult<{ unread_count: number }> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useUnreadCount],
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
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useListNotifications] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useUnreadCount] });
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
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useListNotifications] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useUnreadCount] });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useListPreferences(options: QueryOptions = {}): UseQueryResult<ListPreferencesResponse> {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useListPreferences],
        queryFn: () => bodhveda.recipients.preferences.list(recipientID),
        ...options,
    });
}

export function useSetPreference(options: MutationOptions = {}) {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();
    const queryClient = useQueryClient();

    return useMutation<SetPreferenceResponse, unknown, SetPreferenceRequest, unknown>({
        mutationFn: (req: SetPreferenceRequest) => {
            return bodhveda.recipients.preferences.set(recipientID, req);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useListPreferences] });
        },
        ...options,
    });
}

export function useCheckPreference(target: Target, options: QueryOptions = {}) {
    const bodhveda = useBodhveda();
    const recipientID = useRecipientID();

    return useQuery({
        queryKey: [QUERY_KEYS.useListPreferences, target],
        queryFn: () => bodhveda.recipients.preferences.check(recipientID, { target }),
        ...options,
    });
}
