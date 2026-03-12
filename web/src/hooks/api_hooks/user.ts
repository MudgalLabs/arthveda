import { AnyUseMutationOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { CanUpdateHomeCurrnecyResponse, UserMeResponse } from "@/lib/api/user";
import { CurrencyCode } from "@/lib/api/currency";

export function useMe() {
    return useQuery({
        queryKey: ["useMe"],
        queryFn: () => api.user.me(),
        select: (res) => res.data as ApiRes<UserMeResponse>,
        staleTime: Infinity,
    });
}

export function useMarkAsOnboarded(options: AnyUseMutationOptions = {}) {
    const { onSuccess, ...restOptions } = options;
    const client = useQueryClient();

    return useMutation<void>({
        mutationFn: () => api.user.markAsOnboarded(),
        onSuccess: async (...args) => {
            await client.invalidateQueries({
                queryKey: ["useMe"],
            });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useCanUpdateHomeCurrency() {
    return useQuery({
        queryKey: ["useCanUpdateHomeCurrency"],
        queryFn: () => api.user.canUpdateHomeCurrency(),
        select: (res) => res.data as ApiRes<CanUpdateHomeCurrnecyResponse>,
    });
}

export function useUpdateHomeCurrency(options: AnyUseMutationOptions = {}) {
    const { onSuccess, ...restOptions } = options;
    const client = useQueryClient();

    return useMutation({
        mutationFn: (newHomeCurrency: CurrencyCode) => api.user.updateHomeCurrency(newHomeCurrency),
        onSuccess: async (...args) => {
            client.invalidateQueries({ queryKey: ["useMe"] });
            client.invalidateQueries({ queryKey: ["useCanUpdateHomeCurrency"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}
