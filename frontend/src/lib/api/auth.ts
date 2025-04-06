import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/apiRoutes";

import { SigninRequestBody, SigninResponseBody } from "@/lib/api/types";

export function signin(body: SigninRequestBody) {
    return client.post<SigninRequestBody, SigninResponseBody>(
        API_ROUTES.auth.signin,
        body
    );
}
