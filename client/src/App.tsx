import { FC, Fragment, PropsWithChildren } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
} from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import "@/index.css";

import { AuthLayout } from "@/auth_layout";
import { useAuthentication } from "@/features/auth/auth_context";
import { ROUTES_PUBLIC, ROUTES_PROTECTED, ROUTES } from "@/routes";
import { AppLayout } from "@/app_layout";
import { ToastProvider } from "@/components/toast";
import { AuthenticationProvider } from "@/features/auth/auth_context";
import { SidebarProvider } from "@/components/sidebar/sidebar_context";
import { AddPositionContextProvider } from "@/features/position/add/add_position_context";
import { LoadingScreen } from "./components/loading_screen";

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthentication();
    const { pathname } = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-screen">
                <LoadingScreen />
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
        if (ROUTES_PROTECTED.includes(pathname)) {
            return <AppLayout>{children}</AppLayout>;
        }
    }

    // User is about to visit a public route. Most likely either to an
    // auth flow screen or a 404 screen.
    if (ROUTES_PUBLIC.includes(pathname)) {
        return <AuthLayout>{children}</AuthLayout>;
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
                    <AddPositionContextProvider>
                        <TooltipPrimitive.TooltipProvider>
                            <RouteHandler>
                                <Outlet />
                            </RouteHandler>
                        </TooltipPrimitive.TooltipProvider>
                    </AddPositionContextProvider>
                </SidebarProvider>
            </AuthenticationProvider>
            <ScrollRestoration />
        </Fragment>
    );
}
