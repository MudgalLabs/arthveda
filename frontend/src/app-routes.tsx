import { lazy, Suspense } from "react";
import { type RouteObject } from "react-router-dom";

// Public
const NotFound = lazy(() => import("@/features/not-found/not-found"));
const Signin = lazy(() => import("@/features/signin/signin"));
const Signup = lazy(() => import("@/features/signup/signup"));

// Protected
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));
const Trades = lazy(() => import("@/features/trades/trades"));
const Journal = lazy(() => import("@/features/journal/journal"));

export const APP_ROUTES = {
    // Routes that will be shown if a user is *NOT* signed in.
    signin: "/signin",
    signup: "/signup",

    // Routes that will be shown if a user is signed in.
    dashboard: "/dashboard",
    trades: "/trades",
    journal: "/journal",
};

export const APP_ROUTES_PUBLIC = [APP_ROUTES.signin, APP_ROUTES.signup, "*"];
export const APP_ROUTES_PROTECTED = [APP_ROUTES.dashboard];

export const appRoutes: Array<RouteObject> = [
    {
        index: true,
        element: null,
    },
    {
        path: APP_ROUTES.signin,
        element: (
            <Suspense>
                <Signin />
            </Suspense>
        ),
    },
    {
        path: APP_ROUTES.signup,
        element: (
            <Suspense>
                <Signup />
            </Suspense>
        ),
    },
    {
        path: APP_ROUTES.dashboard,
        element: (
            <Suspense>
                <Dashboard />
            </Suspense>
        ),
    },
    {
        path: APP_ROUTES.trades,
        element: (
            <Suspense>
                <Trades />
            </Suspense>
        ),
    },
    {
        path: APP_ROUTES.journal,
        element: (
            <Suspense>
                <Journal />
            </Suspense>
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
