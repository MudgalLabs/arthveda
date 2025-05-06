import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Error } from "@/features/error/error";
import { ToastProvider } from "@/components/toast";
import { AuthenticationProvider } from "@/context/authentication-context";
import routes from "@/routes";
import App from "@/App";
import { SidebarProvider } from "./components/sidebar/sidebar-context";

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
                <SidebarProvider>
                    <RouterProvider router={router} />
                    <ToastProvider />
                </SidebarProvider>
            </AuthenticationProvider>
        </QueryClientProvider>
    </StrictMode>
);
