import {
    useMutation,
    AnyUseMutationOptions,
    useQuery,
    keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
    CreatePositionRequest,
    CreatePositionResponse,
    ComputePositionRequest,
    ComputePositionResponse,
    PositionSearchResponse,
    PositionSearchRequest,
} from "@/lib/api/position";

export function useCompute(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<ComputePositionResponse>,
        unknown,
        ComputePositionRequest,
        unknown
    >({
        mutationFn: (body: ComputePositionRequest) => {
            return api.position.compute(body);
        },
        ...options,
    });
}

export function useCreate(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<CreatePositionResponse>,
        unknown,
        CreatePositionRequest,
        unknown
    >({
        mutationFn: (body: CreatePositionRequest) => {
            return api.position.create(body);
        },
        ...options,
    });
}

export function useSearch(body: PositionSearchRequest) {
    return useQuery({
        queryKey: ["usePositionsSearch", body],
        queryFn: () => api.position.search(body),
        select: (res) => res.data as ApiRes<PositionSearchResponse>,
        placeholderData: keepPreviousData,
    });
}
