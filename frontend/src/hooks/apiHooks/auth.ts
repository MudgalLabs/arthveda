import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { SigninRequestBody } from "@/lib/api/types";

export function useSignin(options: AnyUseMutationOptions) {
    return useMutation({
        mutationFn: (body: SigninRequestBody) => {
            return api.auth.signin(body);
        },
        ...options,
    });
}
