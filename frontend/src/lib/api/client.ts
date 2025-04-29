import axios from "axios";
import { isProd } from "@/lib/utils";

let baseURL = isProd() ? "/api/v1" : "http://localhost:1337/api/v1";

if (import.meta.env.VITE_CLOUDFLARE_PAGES === "yes") {
    baseURL = import.meta.env.VITE_API_V1_URL;
}

export const client = axios.create({
    baseURL,
    withCredentials: true,
});
