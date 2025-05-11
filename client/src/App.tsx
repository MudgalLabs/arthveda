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
import { AppLayout } from "@/app-layout";
import { Loading } from "@/components/loading";

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthentication();
    const { pathname } = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-screen">
                <Loading />
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
            <RouteHandler>
                <Outlet />
            </RouteHandler>
            <ScrollRestoration />
        </Fragment>
    );
}
