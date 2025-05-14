import { useMutation, AnyUseMutationOptions } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { SigninRequest, SignupRequest } from "@/lib/api/auth";
import { User } from "@/lib/api/user";

export function useSignup(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes, unknown, SignupRequest, unknown>({
        mutationFn: function m(body: SignupRequest) {
            return api.auth.signup(body);
        },
        ...options,
    });
}

export function useSignin(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes<{ user: User }>, unknown, SigninRequest, unknown>(
        {
            mutationFn: (body: SigninRequest) => {
                return api.auth.signin(body);
            },
            ...options,
        }
    );
}

export function useSignout(options: AnyUseMutationOptions = {}) {
    return useMutation<ApiRes, unknown, void, unknown>({
        mutationFn: () => {
            return api.auth.signout();
        },
        ...options,
    });
}
