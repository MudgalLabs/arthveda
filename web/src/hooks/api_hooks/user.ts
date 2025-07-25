import { AnyUseMutationOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { UserMeResponse } from "@/lib/api/user";

export function useMe() {
    return useQuery({
        queryKey: ["useMe"],
        queryFn: () => api.user.me(),
        select: (res) => res.data as ApiRes<UserMeResponse>,
    });
}

export function useCancelSubscriptionAtPeriodEnd(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;
    return useMutation<void, unknown, void, unknown>({
        mutationFn: () => api.user.cancelSubscriptionAtPeriodEnd(),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useMe"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}
