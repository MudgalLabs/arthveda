import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { analytics, StartDemoRequest, StartDemoResponse } from "@/lib/api/analytics";

export const useStartDemo = (options?: UseMutationOptions<StartDemoResponse, Error, StartDemoRequest>) => {
    return useMutation({
        mutationFn: analytics.startDemo,
        ...options,
    });
};
