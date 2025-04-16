import axios from "axios";
import { isProd } from "@/lib/utils";

const baseURL = isProd() ? "/api/v1" : "http://localhost:1337/api/v1";

export const client = axios.create({
    baseURL,
    withCredentials: true,
});
