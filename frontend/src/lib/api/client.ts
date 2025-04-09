import axios from "axios";

export const client = axios.create({
    baseURL: import.meta.env.PROD ? "/api/v1" : "http://localhost:6969/api/v1",
    withCredentials: true,
});
