import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
    AddPositionRequest,
    AddPositionResponse,
    ComputePositionRequest,
    ComputePositionResponse,
} from "@/lib/api/position";
import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

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

export function useAdd(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<AddPositionResponse>,
        unknown,
        AddPositionRequest,
        unknown
    >({
        mutationFn: (body: AddPositionRequest) => {
            return api.position.add(body);
        },
        ...options,
    });
}
