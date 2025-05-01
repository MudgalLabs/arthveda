import axios from "axios";
import { isProd } from "../utils";

let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    if (isProd()) {
        throw new Error("Arthveda's API URL is invalid: " + API_URL);
    } else {
        API_URL = "http://localhost:1337";
    }
}

export const client = axios.create({
    baseURL: `${API_URL}/v1`,
    withCredentials: true,
});
