import { lazy, Suspense } from "react";
import { type RouteObject } from "react-router-dom";

// Public
const NotFound = lazy(() => import("@/features/not_found/not_found"));
const Signin = lazy(() => import("@/features/auth/sign_in/sign_in"));
const Signup = lazy(() => import("@/features/auth/sign_up/sign_up"));

// Protected
const AddTrade = lazy(() => import("@/features/trade/add/add_trade"));
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));
const ImportTrades = lazy(
    () => import("@/features/trade/import/import_trades")
);
const Trades = lazy(() => import("@/features/trade/list/trade_list"));
const Settings = lazy(() => import("@/features/settings/settings"));

export const ROUTES = {
    //
    // Routes that don't require user to be authenticated.
    //
    index: "/",
    notFound: "*",

    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",

    //
    // App routes that will be accessible if a user is signed in.
    //
    dashboard: "/dashboard",
    settings: "/settings",
    // All routes related to Trade.
    tradeList: "/trade/list",
    addTrade: "/trade/add",
    importTrades: "/trade/import",
};

export const ROUTES_PUBLIC = [
    ROUTES.index,
    ROUTES.notFound,
    ROUTES.signIn,
    ROUTES.signUp,
    ROUTES.forgotPassword,
];
export const ROUTES_PROTECTED = [
    ROUTES.addTrade,
    ROUTES.dashboard,
    ROUTES.importTrades,
    ROUTES.settings,
    ROUTES.tradeList,
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
        path: ROUTES.notFound,
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
        path: ROUTES.importTrades,
        element: (
            <Suspense>
                <ImportTrades />
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
        path: ROUTES.tradeList,
        element: (
            <Suspense>
                <Trades />
            </Suspense>
        ),
    },
];

export default routes;
