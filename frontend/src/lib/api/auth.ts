import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api-routes";

import {
    ApiRes,
    GetMeResponseBody,
    SigninRequestBody,
    SigninResponseBody,
    SignupRequestBody,
} from "@/lib/api/types";

export function signup(body: SignupRequestBody) {
    return client.post<SignupRequestBody, ApiRes>(API_ROUTES.auth.signup, body);
}

export function signin(body: SigninRequestBody) {
    return client.post<SigninRequestBody, ApiRes<{ user: GetMeResponseBody }>>(
        API_ROUTES.auth.signin,
        body
    );
}

export function signout() {
    return client.post(API_ROUTES.auth.signout);
}
