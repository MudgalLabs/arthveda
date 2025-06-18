/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Arthveda's API URL.
     * NOTE: This should be without the API version in the path.
     * @example "https://api.arthveda.io"
     */
    readonly ARTHVEDA_API_URL: string;
    /**
     * The URL for Google OAuth.
     * This is used for the "Continue with Google" button.
     * @example "https://api.arthveda.io/v1/auth/oauth/google"
     */
    readonly ARTHVEDA_GOOGLE_OAUTH_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
