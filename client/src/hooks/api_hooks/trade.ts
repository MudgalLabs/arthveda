import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { ComputeForAddRequest, ComputeForAddResponse } from "@/lib/api/trade";
import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

export function useComputeForAddTrade(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<ComputeForAddResponse>,
        unknown,
        ComputeForAddRequest,
        unknown
    >({
        mutationFn: (body: ComputeForAddRequest) => {
            return api.trade.computeForAdd(body);
        },
        ...options,
    });
}
