import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { StartDemoRequest, StartDemoResponse } from "@/lib/api/analytics";
import { api } from "@/lib/api";

export const useStartDemo = (options: UseMutationOptions<StartDemoResponse, Error, StartDemoRequest> = {}) => {
    return useMutation({
        mutationFn: api.analytics.startDemo,
        ...options,
    });
};
