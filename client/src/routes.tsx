import { type RouteObject } from "react-router-dom";

// Public
import NotFound from "@/features/not_found/not_found";
import SignIn from "@/features/auth/sign_in/sign_in";
import SignUp from "@/features/auth/sign_up/sign_up";

// Protected
import DashboardLazy from "@/features/dashboard/dashboard_lazy";
import AddPositionLazy from "@/features/position/add/add_position_lazy";
import ListPositionsLazy from "@/features/position/list/list_positions_lazy";
import ImportPositions from "@/features/position/import/import_positions";
import Settings from "@/features/settings/settings";

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
        element: <NotFound />,
    },
    {
        path: ROUTES.signIn,
        element: <SignIn />,
    },
    {
        path: ROUTES.signUp,
        element: <SignUp />,
    },
    /**
     * PROTECTED
     */
    {
        path: ROUTES.addPosition,
        element: <AddPositionLazy />,
    },
    {
        path: ROUTES.dashboard,
        element: <DashboardLazy />,
    },
    {
        path: ROUTES.importPositions,
        element: <ImportPositions />,
    },
    {
        path: ROUTES.settings,
        element: <Settings />,
    },
    {
        path: ROUTES.positionList,
        element: <ListPositionsLazy />,
    },
];

export default routes;
