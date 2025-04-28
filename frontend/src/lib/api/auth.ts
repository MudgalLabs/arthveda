import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api-routes";

import {
    ApiRes,
    GetMeResponse,
    SigninRequest,
    SignupRequest,
} from "@/lib/api/types";

export function signup(body: SignupRequest) {
    return client.post<SignupRequest, ApiRes>(API_ROUTES.auth.signup, body);
}

export function signin(body: SigninRequest) {
    return client.post<SigninRequest, ApiRes<{ user: GetMeResponse }>>(
        API_ROUTES.auth.signin,
        body
    );
}

export function signout() {
    return client.post(API_ROUTES.auth.signout);
}
