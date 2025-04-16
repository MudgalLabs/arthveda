import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-ignore
export default ({ mode }) => {
    return defineConfig({
        plugins: [react(), tailwindcss()],
        server: {
            host: "localhost",
            port: 1337,
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
    });
};
