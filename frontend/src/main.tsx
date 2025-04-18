import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import routes from "@/routes";
import App from "@/App";
import { Error } from "@/features/error/error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "@/components/toast";
import { TooltipProvider } from "@/components/tooltip";

import { AuthenticationProvider } from "./context/authentication-context";

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
});

root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthenticationProvider>
                <TooltipProvider>
                    <RouterProvider router={router} />
                    <ToastContainer position="top-right" theme="dark" />
                </TooltipProvider>
            </AuthenticationProvider>
        </QueryClientProvider>
    </StrictMode>
);
