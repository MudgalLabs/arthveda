import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
    CreatePositionRequest,
    CreatePositionResponse,
    ComputePositionRequest,
    ComputePositionResponse,
    ListPositionsReponse,
} from "@/lib/api/position";
import {
    useMutation,
    AnyUseMutationOptions,
    useQuery,
} from "@tanstack/react-query";

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

export function useSearch() {
    return useQuery({
        queryKey: ["useSearchPositions"],
        queryFn: () => api.position.search(),
        select: (res) => res.data as ApiRes<ListPositionsReponse>,
    });
}
