import { useQuery, useMutation, useQueryClient, AnyUseMutationOptions } from "@tanstack/react-query";
import * as api from "@/lib/api/tag";
import { ListTagGroupsResponse } from "@/lib/api/tag";
import { ApiRes } from "@/lib/api/client";

export function useListTagGroups() {
    return useQuery({
        queryKey: ["useListTagGroups"],
        queryFn: () => api.listTagGroups(),
        select: (res) => res.data as ApiRes<ListTagGroupsResponse>,
    });
}

export function useCreateTagGroup(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: api.createTagGroup,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useCreateTag(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: api.createTag,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}
