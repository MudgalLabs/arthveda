import { type RouteObject } from "react-router-dom";
import { ROUTES } from "@/constants";

// Public
import NotFoundLazy from "@/features/not_found/not_found_lazy";
import SignInLazy from "@/features/auth/sign_in/sign_in_lazy";

// Protected
import DashboardLazy from "@/features/dashboard/dashboard_lazy";
import ListPositionsLazy from "@/features/position/list/list_positions_lazy";
import ViewPositionLazy from "@/features/position/view/view_position_lazy";
import NewPositionLazy from "@/features/position/new/new_position_lazy";
import ImportPositionsLazy from "@/features/position/import/import_positions_lazy";
import BrokerAccountsLazy from "@/features/settings/broker_accounts/broker_accounts_lazy";
import PlanAndBillingLazy from "@/features/settings/plan_and_billing/plan_and_billing_lazy";

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
        path: ROUTES.listPositions,
        element: <ListPositionsLazy />,
    },
    {
        path: ROUTES.viewPosition(":id"),
        element: <ViewPositionLazy />,
    },
    {
        path: ROUTES.newPositions,
        element: <NewPositionLazy />,
    },
    {
        path: ROUTES.importPositions,
        element: <ImportPositionsLazy />,
    },
    {
        path: ROUTES.brokerAccounts,
        element: <BrokerAccountsLazy />,
    },
    {
        path: ROUTES.planAndBilling,
        element: <PlanAndBillingLazy />,
    },
];

export default routes;
