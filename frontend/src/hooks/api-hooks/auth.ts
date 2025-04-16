import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

import { api } from "@/lib/api";
import {
    ApiRes,
    GetMeResponseBody,
    SigninRequestBody,
    SignupRequestBody,
} from "@/lib/api/types";

export function useSignup(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes, unknown, SignupRequestBody, unknown>({
        mutationFn: function m(body: SignupRequestBody) {
            return api.auth.signup(body);
        },
        ...options,
    });
}

export function useSignin(options: AnyUseMutationOptions = {}) {
    return useMutation<
        ApiRes<{ user: GetMeResponseBody }>,
        unknown,
        SigninRequestBody,
        unknown
    >({
        mutationFn: (body: SigninRequestBody) => {
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
