import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { SidebarProvider } from "@/components/sidebar/sidebar_context";
import { AddPositionContextProvider } from "@/features/position/add/add_position_context";
import { Error } from "@/features/error/error";
import { ToastProvider } from "@/components/toast";
import { AuthenticationProvider } from "@/features/auth/auth_context";
import routes from "@/routes";
import App from "@/App";

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
                    <AddPositionContextProvider>
                        <TooltipPrimitive.TooltipProvider>
                            <RouterProvider router={router} />
                            <ToastProvider />
                        </TooltipPrimitive.TooltipProvider>
                    </AddPositionContextProvider>
                </SidebarProvider>
            </AuthenticationProvider>
        </QueryClientProvider>
    </StrictMode>
);
