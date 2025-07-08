import { type RouteObject } from "react-router-dom";
import { ROUTES } from "@/routes_constants";

// Public
import NotFoundLazy from "@/features/not_found/not_found_lazy";
import SignInLazy from "@/features/auth/sign_in/sign_in_lazy";

// Protected
import DashboardLazy from "@/features/dashboard/dashboard_lazy";
import ExplorePositionsLazy from "@/features/position/explore/explore_positions_lazy";
import ViewPositionLazy from "@/features/position/view/view_position_lazy";
import AddPositionLazy from "@/features/position/add/add_position_lazy";
import ImportPositionsLazy from "@/features/position/import/import_positions_lazy";
import BrokerAccountsLazy from "@/features/settings/broker_accounts/broker_accounts_lazy";

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
        element: <NotFoundLazy />,
    },
    {
        path: ROUTES.signIn,
        element: <SignInLazy />,
    },

    /**
     * PROTECTED
     */

    {
        path: ROUTES.dashboard,
        element: <DashboardLazy />,
    },
    {
        path: ROUTES.explorePositions,
        element: <ExplorePositionsLazy />,
    },
    {
        path: ROUTES.viewPosition(":id"),
        element: <ViewPositionLazy />,
    },
    {
        path: ROUTES.addPosition,
        element: <AddPositionLazy />,
    },
    {
        path: ROUTES.importPositions,
        element: <ImportPositionsLazy />,
    },
    {
        path: ROUTES.brokerAccounts,
        element: <BrokerAccountsLazy />,
    },
];

export default routes;
