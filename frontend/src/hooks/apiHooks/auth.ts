import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { SigninRequestBody, SignupRequestBody } from "@/lib/api/types";

export function useSignup(options: AnyUseMutationOptions = {}) {
    return useMutation({
        mutationFn: (body: SignupRequestBody) => {
            return api.auth.signup(body);
        },
        ...options,
    });
}

export function useSignin(options: AnyUseMutationOptions = {}) {
    return useMutation({
        mutationFn: (body: SigninRequestBody) => {
            return api.auth.signin(body);
        },
        ...options,
    });
}

export function useSignout(options: AnyUseMutationOptions = {}) {
    return useMutation({
        mutationFn: () => {
            return api.auth.signout();
        },
        ...options,
    });
}
