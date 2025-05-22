import { lazy, Suspense } from "react";
import { type RouteObject } from "react-router-dom";
import { ListPositionContextProvider } from "@/features/position/list/list_positions_context";

// Public
const NotFound = lazy(() => import("@/features/not_found/not_found"));
const Signin = lazy(() => import("@/features/auth/sign_in/sign_in"));
const Signup = lazy(() => import("@/features/auth/sign_up/sign_up"));

// Protected
const AddPosition = lazy(() => import("@/features/position/add/add_position"));
const Dashboard = lazy(() => import("@/features/dashboard/dashboard"));
const ImportTrades = lazy(
    () => import("@/features/position/import/import_positions")
);
const ListPositions = lazy(
    () => import("@/features/position/list/list_positions")
);
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
    // All routes related to Position.
    positionList: "/position/list",
    addPosition: "/position/add",
    importPositions: "/position/import",
};

export const ROUTES_PUBLIC = [
    ROUTES.index,
    ROUTES.notFound,
    ROUTES.signIn,
    ROUTES.signUp,
    ROUTES.forgotPassword,
];
export const ROUTES_PROTECTED = [
    ROUTES.addPosition,
    ROUTES.dashboard,
    ROUTES.importPositions,
    ROUTES.settings,
    ROUTES.positionList,
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
        path: ROUTES.addPosition,
        element: (
            <Suspense>
                <AddPosition />
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
        path: ROUTES.importPositions,
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
        path: ROUTES.positionList,
        element: (
            <Suspense>
                <ListPositionContextProvider>
                    <ListPositions />
                </ListPositionContextProvider>
            </Suspense>
        ),
    },
];

export default routes;
