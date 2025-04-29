/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Arthveda's API URL.
     * NOTE: This should be without the API version in the path.
     * @example "https://api.arthveda.io"
     */
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
