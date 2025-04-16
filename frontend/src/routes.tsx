import { lazy, Suspense } from "react";
import { type RouteObject } from "react-router-dom";

// Public
const NotFound = lazy(() => import("@/features/not-found/not-found"));
const Signin = lazy(() => import("@/features/sign-in/sign-in"));
const Signup = lazy(() => import("@/features/sign-up/sign-up"));

// Protected
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));
const Trades = lazy(() => import("@/features/trades/trades"));
const Journal = lazy(() => import("@/features/journal/journal"));

export const ROUTES = {
    // Auth routes.
    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",

    // App routes that will be accessible if a user is signed in.
    dashboard: "/dashboard",
    trades: "/trades",
    journal: "/journal",
};

export const ROUTES_PUBLIC = [ROUTES.signIn, ROUTES.signUp, "*"];
export const ROUTES_PROTECTED = [ROUTES.dashboard];

export const routes: Array<RouteObject> = [
    {
        index: true,
        element: null,
    },
    {
        path: ROUTES.signIn,
        element: (
            <Suspense>
                <Signin />
            </Suspense>
        ),
    },
    {
        path: ROUTES.signUp,
        element: (
            <Suspense>
                <Signup />
            </Suspense>
        ),
    },
    {
        path: ROUTES.dashboard,
        element: (
            <Suspense>
                <Dashboard />
            </Suspense>
        ),
    },
    {
        path: ROUTES.trades,
        element: (
            <Suspense>
                <Trades />
            </Suspense>
        ),
    },
    {
        path: ROUTES.journal,
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

export default routes;
