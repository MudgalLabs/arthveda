import axios from "axios";

console.log({
    "import.meta.env.VITE_API_URL": import.meta.env.VITE_API_URL,
    "import.meta.env": import.meta.env,
});
let baseURL = `${import.meta.env.VITE_API_URL}/v1`;
console.log({ baseURL });

if (!baseURL) {
    throw new Error("Arthveda's API URL is invalid");
}

export const client = axios.create({
    baseURL,
    withCredentials: true,
});
