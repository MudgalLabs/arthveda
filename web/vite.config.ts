import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-ignore
export default ({ mode }) => {
    return defineConfig({
        plugins: [react(), tailwindcss()],
        server: {
            host: "localhost",
            port: 6969,
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
        envPrefix: "ARTHVEDA_",
        envDir: mode === "development" ? "../" : undefined,
    });
};
