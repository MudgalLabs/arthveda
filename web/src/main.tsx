import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { PostHogProvider } from "posthog-js/react";

import { Error } from "@/features/error/error";
import routes from "@/routes";
import App from "@/App";
import { apiErrorHandler } from "./lib/api";
import posthog from "posthog-js";

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
                <RouterProvider router={router} />
            </QueryClientProvider>
        </PostHogProvider>
    </StrictMode>
);
