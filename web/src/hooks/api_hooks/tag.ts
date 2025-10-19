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

export function useUpdateTag(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (body: api.UpdateTagRequest) => api.updateTag(body),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useUpdateTagGroup(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (body: api.UpdateTagGroupRequest) => api.updateTagGroup(body),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useDeleteTagGroup(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (tag_group_id: string) => api.deleteTagGroup(tag_group_id),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useDeleteTag(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (tag_id: string) => api.deleteTag(tag_id),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useListTagGroups"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}
