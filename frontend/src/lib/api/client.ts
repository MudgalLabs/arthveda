import axios from "axios";

let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("Arthveda's API URL is invalid");
}

export const client = axios.create({
    baseURL: `${API_URL}/v1`,
    withCredentials: true,
});
