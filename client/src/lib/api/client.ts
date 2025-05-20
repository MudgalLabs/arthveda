import axios from "axios";

import { isProd } from "@/lib/utils";

let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    if (isProd()) {
        throw new Error("Arthveda's API URL is invalid: " + API_URL);
    } else {
        API_URL = "http://localhost:1337";
    }
}

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

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
