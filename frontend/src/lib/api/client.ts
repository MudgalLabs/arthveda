import axios from "axios";
import { isProd } from "@/lib/utils";

console.log({
    "vite.VITE_CLOUDFLARE_PAGES": import.meta.env.VITE_CLOUDFLARE_PAGES,
    "vite.VITE_API_V1_URL": import.meta.env.VITE_API_V1_URL,
    "import.meta.env": import.meta.env,
});

let baseURL = isProd() ? "/api/v1" : "http://localhost:1337/api/v1";

console.log("before", { baseURL });

if (import.meta.env.VITE_CLOUDFLARE_PAGES === "yes") {
    baseURL = import.meta.env.VITE_API_V1_URL;
}

console.log("after", { baseURL });

export const client = axios.create({
    baseURL,
    withCredentials: true,
});
