import { client, ApiRes } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";
import { User } from "@/lib/api/user";

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export function signup(body: SignupRequest) {
    return client.post<SignupRequest, ApiRes>(API_ROUTES.auth.signup, body);
}

export interface SigninRequest {
    email: string;
    password: string;
}

export interface SigninResponse {
    email: string;
    password: string;
}

export function signin(body: SigninRequest) {
    return client.post<SigninRequest, ApiRes<{ user: User }>>(
        API_ROUTES.auth.signin,
        body
    );
}

export function signout() {
    return client.post(API_ROUTES.auth.signout);
}
