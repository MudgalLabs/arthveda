import { lazy, Suspense, FC, Fragment, PropsWithChildren } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
} from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import "@/index.css";

import { useAuthentication } from "@/features/auth/auth_context";
import { ToastProvider } from "@/components/toast";
import { AuthenticationProvider } from "@/features/auth/auth_context";
import { SidebarProvider } from "@/components/sidebar/sidebar_context";
import { LoadingScreen } from "@/components/loading_screen";
import { ROUTES, ROUTES_PROTECTED, ROUTES_PUBLIC } from "@/routes_constants";

const AppLayout = lazy(() => import("@/app_layout"));

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthentication();
    const { pathname } = useLocation();

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
        !isAuthenticated &&
        (ROUTES_PROTECTED.includes(pathname) || pathname == ROUTES.index)
    ) {
        // Redirect user to signin screen.
        return <Navigate to={ROUTES.signIn} />;
    }

    if (isAuthenticated) {
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

            <AuthenticationProvider>
                <SidebarProvider>
                    <TooltipPrimitive.TooltipProvider>
                        <Suspense fallback={<LoadingScreen />}>
                            <RouteHandler>
                                <Outlet />
                            </RouteHandler>
                        </Suspense>
                    </TooltipPrimitive.TooltipProvider>
                </SidebarProvider>
            </AuthenticationProvider>
            <ScrollRestoration />
        </Fragment>
    );
}
