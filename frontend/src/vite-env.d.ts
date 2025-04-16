/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_PORT: number;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
