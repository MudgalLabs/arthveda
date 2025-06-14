import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
    QueryClient,
    QueryClientProvider,
    QueryCache,
} from "@tanstack/react-query";

import { Error } from "@/features/error/error";
import routes from "@/routes";
import App from "@/App";
import { apiErrorHandler } from "./lib/api";

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

root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>
);
