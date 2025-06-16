import { useMutation, AnyUseMutationOptions, useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
    CreatePositionRequest,
    CreatePositionResponse,
    ComputePositionRequest,
    ComputePositionResponse,
    PositionSearchResponse,
    PositionSearchRequest,
    ImportPositionsRequest,
    ImportPositionsResponse,
    GetPositionResponse,
    UpdatePositionRequest,
    UpdatePositionResponse,
} from "@/lib/api/position";

let computeAbortController: AbortController | null = null;

export function useCompute(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes<ComputePositionResponse>, unknown, ComputePositionRequest, unknown>({
        mutationFn: (body: ComputePositionRequest) => {
            // Cancel previous request if any
            if (computeAbortController) {
                computeAbortController.abort();
            }
            computeAbortController = new AbortController();
            return api.position.compute(body, computeAbortController.signal);
        },
        ...options,
    });
}

export function useCreate(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes<CreatePositionResponse>, unknown, CreatePositionRequest, unknown>({
        mutationFn: (body: CreatePositionRequest) => {
            return api.position.create(body);
        },
        ...options,
    });
}

export function useUpdate(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes<UpdatePositionResponse>, unknown, { id: string; body: UpdatePositionRequest }, unknown>({
        mutationFn: ({ id, body }: { id: string; body: UpdatePositionRequest }) => {
            return api.position.update(id, body);
        },
        ...options,
    });
}

export function useDelete(options: AnyUseMutationOptions = {}) {
    return useMutation({
        mutationFn: (id: string) => {
            return api.position.deletePosition(id);
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
        refetchOnMount: true,
    });
}

export function useImport(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes<ImportPositionsResponse>, unknown, ImportPositionsRequest, unknown>({
        mutationFn: (body: ImportPositionsRequest) => {
            return api.position.importPositions(body);
        },
        ...options,
    });
}

export function useGetPosition(id: string) {
    return useQuery({
        queryKey: ["useGetPosition", id],
        queryFn: () => api.position.getPosition(id),
        select: (res) => res.data as ApiRes<GetPositionResponse>,
    });
}
