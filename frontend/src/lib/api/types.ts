interface ApiResError {
    message: string;
    description: string;
}

export interface ApiRes<T = unknown> {
    status: "success" | "error";
    message: string;
    errors: ApiResError[];
    data: T;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface SigninRequest {
    email: string;
    password: string;
}

export interface SigninResponse {
    email: string;
    password: string;
}

export interface GetMeResponse {
    id: number;
    email: string;
    display_name: string;
    display_image: string;
    created_at: string;
    update_at: string;
}
