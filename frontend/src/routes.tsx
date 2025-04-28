import { lazy, Suspense } from "react";
import { type RouteObject } from "react-router-dom";

// Public
const NotFound = lazy(() => import("@/features/not-found/not-found"));
const Signin = lazy(() => import("@/features/sign-in/sign-in"));
const Signup = lazy(() => import("@/features/sign-up/sign-up"));

// Protected
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));
const Trades = lazy(() => import("@/features/trades/trades"));
const AddTrade = lazy(() => import("@/features/add-trade/add-trade"));
const Settings = lazy(() => import("@/features/settings/settings"));

export const ROUTES = {
    index: "/",

    // Auth routes.
    forgotPassword: "/forgot-password",
    signIn: "/sign-in",
    signUp: "/sign-up",

    // App routes that will be accessible if a user is signed in.
    addTrade: "/add-trade",
    dashboard: "/dashboard",
    settings: "/settings",
    trades: "/trades",
};

export const ROUTES_PUBLIC = [
    ROUTES.index,
    ROUTES.forgotPassword,
    ROUTES.signIn,
    ROUTES.signUp,
    "*",
];
export const ROUTES_PROTECTED = [
    ROUTES.addTrade,
    ROUTES.dashboard,
    ROUTES.settings,
    ROUTES.trades,
];

export const routes: Array<RouteObject> = [
    /**
     * PUBLIC
     */
    {
        index: true,
        element: null,
    },
    {
        path: "*",
        element: (
            <Suspense>
                <NotFound />
            </Suspense>
        ),
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
    /**
     * PROTECTED
     */
    {
        path: ROUTES.addTrade,
        element: (
            <Suspense>
                <AddTrade />
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
        path: ROUTES.settings,
        element: (
            <Suspense>
                <Settings />
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
];

export default routes;
