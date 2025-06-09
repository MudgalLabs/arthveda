import { lazy, Suspense, FC, Fragment, PropsWithChildren } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
} from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import "@/index.css";

import { ToastProvider } from "@/components/toast";
import { SidebarProvider } from "@/components/sidebar/sidebar_context";
import { LoadingScreen } from "@/components/loading_screen";
import { ROUTES, ROUTES_PROTECTED, ROUTES_PUBLIC } from "@/routes_constants";
import { useAuthStore } from "@/features/auth/auth_store";
import { apiHooks } from "@/hooks/api_hooks";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { apiErrorHandler } from "@/lib/api";

const AppLayout = lazy(() => import("@/app_layout"));

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const setUser = useAuthStore((s) => s.setUser);
    const isLoading = useAuthStore((s) => s.isLoading);
    const setIsLoading = useAuthStore((s) => s.setIsLoading);

    const { pathname } = useLocation();
    const { data, isSuccess, isError, error } = apiHooks.user.useMe();

    useEffectOnce(
        (deps) => {
            if (deps.isError && deps.error) {
                apiErrorHandler(error);
                setIsLoading(false);
            }
        },
        { isError, error },
        (deps) => {
            return deps.isError;
        }
    );

    useEffectOnce(
        (deps) => {
            if (deps.isSuccess && deps.data) {
                setUser(deps.data.data);
                setIsLoading(false);
            }
        },
        { isSuccess, data },
        (deps) => {
            return deps.isSuccess;
        }
    );

    if (isLoading) {
        return (
            <div className="h-full w-full">
                <LoadingScreen withLogo />
            </div>
        );
    }

    // The user is not signed in and is trying to access a protected route
    // or going to home('/') page. There is no home route.
    if (
        !accessToken &&
        (ROUTES_PROTECTED.includes(pathname) || pathname == ROUTES.index)
    ) {
        // Redirect user to signin screen.
        return <Navigate to={ROUTES.signIn} />;
    }

    if (accessToken) {
        // The user is trying to go to home(`/`) or to the auth flow route.
        // We should redirect the user to `/dashboard` as they are signed in.
        if (ROUTES_PUBLIC.includes(pathname)) {
            // Redirect user to dashboard.
            return <Navigate to={ROUTES.dashboard} />;
        }

        // User is about to visit an app route.
        if (
            ROUTES_PROTECTED.includes(pathname) ||
            pathname.startsWith(pathname)
        ) {
            return <AppLayout>{children}</AppLayout>;
        }
    }

    return children;
};

export default function App() {
    return (
        <Fragment>
            {/* Putting ToastProvider here instead of in main.tsx
                because putting it here gives Toasts access to react-router
                hooks and state. */}
            <ToastProvider />

            <SidebarProvider>
                <TooltipPrimitive.TooltipProvider>
                    <Suspense fallback={<LoadingScreen />}>
                        <RouteHandler>
                            <Outlet />
                        </RouteHandler>
                    </Suspense>
                </TooltipPrimitive.TooltipProvider>
            </SidebarProvider>

            <ScrollRestoration />
        </Fragment>
    );
}
