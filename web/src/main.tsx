import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { AuthenticationProvider } from "@/features/auth/auth_context";
import { Error } from "@/features/error/error";
import routes from "@/routes";
import App from "@/App";
import { apiErrorHandler } from "@/lib/api";

const container = document.getElementById("root") as HTMLElement;

const root = createRoot(container);

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: routes,
        errorElement: Error,
    },
]);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },

    queryCache: new QueryCache({
        onError: (error) => {
            apiErrorHandler(error);
        },
    }),
});

posthog.init(import.meta.env.ARTHVEDA_POSTHOG_KEY, {
    api_host: import.meta.env.ARTHVEDA_POSTHOG_HOST,
    defaults: "2025-05-24",
});

root.render(
    <StrictMode>
        <PostHogProvider client={posthog}>
            <QueryClientProvider client={queryClient}>
                <AuthenticationProvider>
                    <RouterProvider router={router} />
                </AuthenticationProvider>
            </QueryClientProvider>
        </PostHogProvider>
    </StrictMode>
);
