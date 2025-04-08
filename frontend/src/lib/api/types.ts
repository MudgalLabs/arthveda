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

export interface SignupRequestBody {
    email: string;
    password: string;
}

export interface SigninRequestBody {
    email: string;
    password: string;
}

export interface SigninResponseBody {
    email: string;
    password: string;
}

export interface GetMeResponseBody {
    id: number;
    email: string;
    created_at: string;
    update_at: string;
}
