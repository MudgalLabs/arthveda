import { type RouteObject } from "react-router-dom";
import { ROUTES } from "@/routes_constants";

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
import ViewPositionLazy from "@/features/position/view/view_position_lazy";

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
    {
        path: ROUTES.viewPosition(":id"),
        element: <ViewPositionLazy />,
    },
];

export default routes;
