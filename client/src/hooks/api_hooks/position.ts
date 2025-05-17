import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import {
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
            return api.trade.compute(body);
        },
        ...options,
    });
}
