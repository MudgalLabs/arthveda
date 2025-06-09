import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import {
    isProd,
    loadFromLocalStorage,
    PersistKeyRefreshToken,
    removeFromLocalStorage,
} from "@/lib/utils";
import { useAuthStore } from "@/features/auth/auth_store";
import { api } from ".";

let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    if (isProd()) {
        throw new Error("API URL is missing");
    } else {
        API_URL = "http://localhost:1337";
    }
}

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

client.interceptors.request.use(
    function (config) {
        const accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    function (response) {
        return response;
    },

    async function (error: AxiosError) {
        const originalRequest: InternalAxiosRequestConfig | undefined =
            error.config;

        if (error.response?.status === 401 && originalRequest) {
            try {
                const refreshToken =
                    loadFromLocalStorage<string>(PersistKeyRefreshToken) ?? "";

                if (refreshToken === "") {
                    useAuthStore.getState().removeAccessToken();
                    useAuthStore.getState().removeUser();
                    removeFromLocalStorage(PersistKeyRefreshToken);
                    return Promise.reject(error);
                }

                const response = await api.auth.refresh(refreshToken);

                const { data } = response;

                useAuthStore.setState({
                    accessToken: data.data.access_token,
                });

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

                return client(originalRequest);
            } catch (error) {
                if (
                    error instanceof AxiosError &&
                    (error.response?.status === 403 ||
                        error.response?.status === 401)
                ) {
                    useAuthStore.getState().removeAccessToken();
                    return;
                }
            }
        }

        return Promise.reject(error);
    }
);

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

export { client };
export type { ApiRes };
