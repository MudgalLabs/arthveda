import { type RouteObject } from "react-router-dom";
import { ROUTES } from "@/constants";

// Public
import NotFoundLazy from "@/features/not_found/not_found_lazy";
import SignInLazy from "@/features/auth/sign_in/sign_in_lazy";

// Protected
import DashboardLazy from "@/features/dashboard/dashboard_lazy";
import InsightsLazy from "@/features/insights/insights_lazy";
import ListPositionsLazy from "@/features/position/list/list_positions_lazy";
import ViewPositionLazy from "@/features/position/view/view_position_lazy";
import NewPositionLazy from "@/features/position/new/new_position_lazy";
import ImportPositionsLazy from "@/features/position/import/import_positions_lazy";
import CalendarLazy from "@/features/calendar/calendar_lazy";
import BrokerAccountsLazy from "@/features/settings/broker_accounts/broker_accounts_lazy";
import PlanAndBillingLazy from "@/features/settings/plan_and_billing/plan_and_billing_lazy";
import NotificationPreferencesLazy from "@/features/settings/notification_preferences/notification_preferences_lazy";
import SettingsLazy from "@/features/settings/settings_lazy";
import TagsManagementLazy from "@/features/tags/tags_management_lazy";
import ReportsLazy from "@/features/reports/reports_lazy";
import OnboardingLazy from "@/features/onboarding/onboarding_lazy";
import { OnboardingWelcome } from "@/features/onboarding/components/onboarding_welcome";
import { OnboardingBroker } from "@/features/onboarding/components/onboarding_broker";
import { OnboardingImport } from "@/features/onboarding/components/onboarding_import";
import { OnboardingMessage } from "@/features/onboarding/components/onboarding_message";

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
        path: ROUTES.onboarding,
        element: <OnboardingLazy />,
        children: [
            {
                index: true,
                element: <OnboardingWelcome />,
            },
            {
                path: "broker",
                element: <OnboardingBroker />,
            },
            {
                path: "import",
                element: <OnboardingImport />,
            },
            {
                path: "message",
                element: <OnboardingMessage />,
            },
        ],
    },

    {
        path: ROUTES.dashboard,
        element: <DashboardLazy />,
    },
    {
        path: ROUTES.insights,
        element: <InsightsLazy />,
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
        path: ROUTES.calendar,
        element: <CalendarLazy />,
    },
    {
        path: ROUTES.reports,
        element: <ReportsLazy />,
    },
    {
        path: ROUTES.brokerAccounts,
        element: <BrokerAccountsLazy />,
    },
    {
        path: ROUTES.planAndBilling,
        element: <PlanAndBillingLazy />,
    },
    {
        path: ROUTES.notificationsPreferences,
        element: <NotificationPreferencesLazy />,
    },
    {
        path: ROUTES.tags,
        element: <TagsManagementLazy />,
    },
    {
        path: ROUTES.settings,
        element: <SettingsLazy />,
    },
];

export default routes;
