import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateUserBrokerAccountPayload) => api.userBrokerAccount.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
        },
    });
}

export function useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserBrokerAccountPayload }) =>
            api.userBrokerAccount.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
        },
    });
}

export function useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.userBrokerAccount.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useUserBrokerAccountList"] });
        },
    });
}
