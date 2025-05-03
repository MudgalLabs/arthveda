import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import routes from "@/routes";
import App from "@/App";
import { Error } from "@/features/error/error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/toast";

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
                <RouterProvider router={router} />
                <ToastProvider
                    theme="dark"
                    richColors
                    visibleToasts={5}
                    position="top-center"
                    icons={{
                        loading: (
                            <Loading size="small" color="--color-primary-300" />
                        ),
                    }}
                    toastOptions={{
                        classNames: {
                            info: "bg-primary-950! border-primary-900! text-primary-300! font-karla! text-sm!",
                        },
                    }}
                />
            </AuthenticationProvider>
        </QueryClientProvider>
    </StrictMode>
);
