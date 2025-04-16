import { FC, Fragment, PropsWithChildren } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
} from "react-router-dom";

import "@/index.css";

import { AuthLayout } from "@/auth-layout";
import { useAuthentication } from "@/context/authentication-context";
import { ROUTES_PUBLIC, ROUTES_PROTECTED, ROUTES } from "@/routes";
import { AppLayout } from "./app-layout";

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthentication();
    const { pathname } = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primary-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-[inherit] border-b-transparent" />
                </div>
            </div>
        );
    }

    // The user is not signed in and is trying to access a protected route
    // or going to home('/') page. There is no home route.
    if (
        !isAuthenticated &&
        (ROUTES_PROTECTED.includes(pathname) || pathname == "/")
    ) {
        let url = ROUTES.signIn;

        // The path isn't home(`/`) so we want to put this as a search param.
        // Maybe user was trynig to go to `/dashboard` but isn't signed in.
        if (pathname !== "/") {
            url += `?from=${pathname}`;
        }

        // Redirect user to signin screen.
        return <Navigate to={url} />;
    }

    if (isAuthenticated) {
        // The user is trying to go to home(`/`) or to the auth flow route.
        // We should redirect the user to `/dashboard` as they are signed in.
        if (pathname === "/" || ROUTES_PUBLIC.includes(pathname)) {
            // Redirect user to dashboard.
            return <Navigate to={ROUTES.dashboard} />;
        }

        // User is about to visit an app route.
        return <AppLayout>{children}</AppLayout>;
    }

    // User is about to visit a public route. Most likely either to an
    // auth flow screen or a 404 screen.
    return <AuthLayout>{children}</AuthLayout>;
};

export default function App() {
    return (
        <Fragment>
            <RouteHandler>
                <Outlet />
            </RouteHandler>
            <ScrollRestoration />
        </Fragment>
    );
}
