import { AnyUseMutationOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { UserMeResponse } from "@/lib/api/user";

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
