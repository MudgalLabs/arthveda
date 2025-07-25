import {
    AnyUseMutationOptions,
    AnyUseQueryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { SubscriptionInvoice } from "@/lib/api/subscription";

export function useCancelSubscriptionAtPeriodEnd(options: AnyUseMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;
    return useMutation<void, unknown, void, unknown>({
        mutationFn: () => api.subscription.cancelSubscriptionAtPeriodEnd(),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["useMe"] });
            onSuccess?.(...args);
        },
        ...restOptions,
    });
}

export function useUserSubscriptionInvoices() {
    return useQuery({
        queryKey: ["useUserSubscriptionInvoices"],
        queryFn: () => api.subscription.fetchUserSubscriptionInvoices(),
        select: (res) => res.data.data as SubscriptionInvoice[],
    });
}

export function useUserSubscriptionInvoiceDownloadLink(
    invoiceId: string,
    options: Omit<AnyUseQueryOptions, "queryKey"> = {}
) {
    return useQuery({
        queryKey: ["useUserSubscriptionInvoiceDownloadLink", invoiceId],
        queryFn: () => api.subscription.fetchUserSubscriptionInvoiceDownloadLink(invoiceId),
        select: (res) => res.data.data.download_link as string,
        ...options,
    });
}
