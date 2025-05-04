import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

import { api } from "@/lib/api";
import {
    ApiRes,
    GetMeResponse,
    SigninRequest,
    SignupRequest,
} from "@/lib/api/types";

export function useSignup(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes, unknown, SignupRequest, unknown>({
        mutationFn: function m(body: SignupRequest) {
            return api.auth.signup(body);
        },
        ...options,
    });
}

export function useSignin(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<{ user: GetMeResponse }>,
        unknown,
        SigninRequest,
        unknown
    >({
        mutationFn: (body: SigninRequest) => {
            return api.auth.signin(body);
        },
        ...options,
    });
}

export function useSignout(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes, unknown, void, unknown>({
        mutationFn: () => {
            return api.auth.signout();
        },
        ...options,
    });
}
