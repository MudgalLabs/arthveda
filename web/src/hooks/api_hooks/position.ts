import {
    useMutation,
    AnyUseMutationOptions,
    useQuery,
    keepPreviousData,
    AnyUseQueryOptions,
    UseQueryResult,
    useQueryClient,
    QueryClient,
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
    ImportPositionsRequest,
    ImportPositionsResponse,
    GetPositionResponse,
    UpdatePositionRequest,
    UpdatePositionResponse,
} from "@/lib/api/position";

const QueriesToInvalidateOnPositionChange = [
    "useGetDashboard",
    "useGetCalendar",
    "useGetCalendarDay",
    "useGetPosition",
    "usePositionsSearch",
    "useMe",
] as const;

type PositionQueryKey = (typeof QueriesToInvalidateOnPositionChange)[number];

function invalidatePositionRelatedQueries(queryClient: QueryClient, exceptions: PositionQueryKey[] = []) {
    QueriesToInvalidateOnPositionChange.forEach((query) => {
        if (exceptions.includes(query)) return;

        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === query });
    });
}

export function useCompute(options: AnyUseMutationOptions = {}) {
    let computeAbortController: AbortController | null = null;

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
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation<ApiRes<CreatePositionResponse>, unknown, CreatePositionRequest, unknown>({
        mutationFn: (body: CreatePositionRequest) => {
            return api.position.create(body);
        },
        onSuccess: (...args) => {
            invalidatePositionRelatedQueries(queryClient);
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useUpdate(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation<ApiRes<UpdatePositionResponse>, unknown, { id: string; body: UpdatePositionRequest }, unknown>({
        mutationFn: ({ id, body }: { id: string; body: UpdatePositionRequest }) => {
            return api.position.update(id, body);
        },
        onSuccess: (...args) => {
            invalidatePositionRelatedQueries(queryClient);
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useDelete(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation({
        mutationFn: (id: string) => {
            return api.position.deletePosition(id);
        },
        onSuccess: (...args) => {
            invalidatePositionRelatedQueries(queryClient, ["useGetPosition"]);
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useSearch(
    body: PositionSearchRequest,
    options: Omit<AnyUseQueryOptions, "queryKey"> = {}
): UseQueryResult<ApiRes<PositionSearchResponse>> {
    return useQuery({
        queryKey: ["usePositionsSearch", body],
        queryFn: () => api.position.search(body),
        select: (res) => res.data as ApiRes<PositionSearchResponse>,
        placeholderData: keepPreviousData,
        refetchOnMount: true,
        ...options,
    });
}

export function useImport(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useMutation<ApiRes<ImportPositionsResponse>, unknown, ImportPositionsRequest, unknown>({
        mutationFn: (body: ImportPositionsRequest) => {
            return api.position.importPositions(body);
        },
        onSuccess: (...args) => {
            invalidatePositionRelatedQueries(queryClient);
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useGetPosition(id: string) {
    return useQuery({
        queryKey: ["useGetPosition", id],
        queryFn: () => api.position.getPosition(id),
        select: (res) => res.data as ApiRes<GetPositionResponse>,
    });
}
