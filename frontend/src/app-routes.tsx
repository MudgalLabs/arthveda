import { lazy, Suspense, FC, PropsWithChildren } from "react";
import { type RouteObject, Navigate, useLocation } from "react-router-dom";
import { useAuthentication } from "./context/authentication-context";

// Public
const NotFound = lazy(() => import("@/features/not-found/not-found"));
const Signin = lazy(() => import("@/features/signin/signin"));
const Signup = lazy(() => import("@/features/signup/signup"));

// Protected
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));

export const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
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

    const publicRoutes = ["/signin", "/signup"];

    if (isAuthenticated) {
        if (pathname === "/" || publicRoutes.includes(pathname)) {
            return <Navigate to="/dashboard" />;
        }

        return children;
    }

    if (
        !isAuthenticated &&
        (pathname === "/" || !publicRoutes.includes(pathname))
    ) {
        return <Navigate to={`/signin?from=${pathname}`} />;
    }

    return children;
};

export const appRoutes: Array<RouteObject> = [
    {
        index: true,
        element: <RouteHandler>{null}</RouteHandler>,
    },
    {
        path: "/signin",
        element: (
            <RouteHandler>
                <Suspense>
                    <Signin />
                </Suspense>
            </RouteHandler>
        ),
    },
    {
        path: "/signup",
        element: (
            <RouteHandler>
                <Suspense>
                    <Signup />
                </Suspense>
            </RouteHandler>
        ),
    },
    {
        path: "/dashboard",
        element: (
            <RouteHandler>
                <Suspense>
                    <Dashboard />
                </Suspense>
            </RouteHandler>
        ),
    },
    {
        path: "*",
        element: (
            <Suspense>
                <NotFound />
            </Suspense>
        ),
    },
];

export default appRoutes;
