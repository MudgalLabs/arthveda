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

    /**
     * If "true", enables Google OAuth for authentication.
     */
    readonly ARTHVEDA_ENABLE_GOOGLE_OAUTH: string;

    /**
     * If "true", enables password-based authentication.
     */
    readonly ARTHVEDA_ENABLE_SIGN_IN: string;

    /**
     * If "true", this shows the login credentials on the login screen for the demo account.
     */
    readonly ARTHVEDA_ENABLE_DEMO: string;

    /**
     * The PostHog key.
     */
    readonly ARTHVEDA_POSTHOG_KEY: string;

    /**
     * The PostHog host URL.
     */
    readonly ARTHVEDA_POSTHOG_HOST: string;

    /**
     * The Paddle client token for payment processing.
     */
    readonly ARTHVEDA_PADDLE_CLIENT_TOKEN: string;

    /**
     * The Paddle price ID for the monthly subscription.
     */
    readonly ARTHVEDA_PADDLE_PRICE_ID_MONTHLY: string;
    J;
    /**
     * The Paddle price ID for the yearly subscription.
     */
    readonly ARTHVEDA_PADDLE_PRICE_ID_YEARLY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
