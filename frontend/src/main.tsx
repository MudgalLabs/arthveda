import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import routes from "@/routes";
import App from "@/App";
import { Error } from "@/features/error/error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/toast";
import { TooltipProvider } from "@/components/tooltip";

import { AuthenticationProvider } from "./context/authentication-context";
import { Loading } from "./components/loading";

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
                    <ToastProvider
                        theme="dark"
                        closeButton
                        visibleToasts={5}
                        icons={{
                            loading: (
                                <Loading
                                    size="small"
                                    color="--color-primary-300"
                                />
                            ),
                        }}
                        toastOptions={{
                            classNames: {
                                toast: "bg-primary-950! border-primary-800! text-sm! font-karla!",
                                title: "text-primary-50! font-medium!",
                                description: "text-primary-100! font-normal!",
                                icon: "text-primary-300!",
                                content: "relative!",
                                closeButton:
                                    "bg-primary-900! text-primary-300! hover:bg-primary-800! hover:text-primary-100!",
                            },
                        }}
                    />
                </TooltipProvider>
            </AuthenticationProvider>
        </QueryClientProvider>
    </StrictMode>
);
