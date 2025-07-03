import axios, { AxiosError, AxiosResponse } from "axios";

import { BROWSER_TIMEZONE, isProd } from "@/lib/utils";
import { ROUTES } from "@/routes_constants";

let API_URL = import.meta.env.ARTHVEDA_API_URL;

if (!API_URL) {
    if (isProd()) {
        throw new Error("API's URL is not set");
    } else {
        API_URL = "http://localhost:1337";
    }
}

function createAPIClient(baseURL: string) {
    const client = axios.create({
        baseURL,
        withCredentials: true,
        headers: {
            "X-Timezone": BROWSER_TIMEZONE,
        },
    });

    client.interceptors.response.use(
        (res: AxiosResponse) => {
            return res;
        },
        async (err: AxiosError) => {
            const status = err.response ? err.response.status : null;

            if (status === 401 || status === 403) {
                if (window.location.pathname !== ROUTES.signIn) {
                    // Redirect to sign-in page if the user is not authenticated.
                    window.history.pushState({}, "", ROUTES.signIn);
                }
            }

            return Promise.reject(err);
        }
    );

    return client;
}

const client = createAPIClient(API_URL);

/** This is API's error object strucutre. */
interface ApiResError {
    message: string;
    description: string;
}

/** This is the API's response structure. */
interface ApiRes<T = unknown> {
    status: "success" | "error";
    message: string;
    errors: ApiResError[];
    data: T;
}

export { createAPIClient as createApiClient, client };
export type { ApiRes };
