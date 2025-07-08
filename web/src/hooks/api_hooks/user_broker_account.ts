import { AnyUseMutationOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
    UserBrokerAccount,
    CreateUserBrokerAccountPayload,
    UpdateUserBrokerAccountPayload,
} from "@/lib/api/user_broker_account";

export function useList() {
    return useQuery({
        queryKey: ["useUserBrokerAccountList"],
        queryFn: () => api.userBrokerAccount.list(),
        select: (res) => res.data as ApiRes<UserBrokerAccount[]>,
    });
}

export function useCreate(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (payload: CreateUserBrokerAccountPayload) => api.userBrokerAccount.create(payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useUpdate(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserBrokerAccountPayload }) =>
            api.userBrokerAccount.update(id, payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useDelete(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (id: string) => api.userBrokerAccount.remove(id),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}
