export const ROUTES = {
    // Routes that don't require user to be authenticated.
    index: "/",
    notFound: "*",
    signIn: "/sign-in",

    // App routes that will be accessible if a user is signed in.
    dashboard: "/dashboard",
    // All routes related to Position.
    listPositions: "/positions",
    newPositions: "/positions/new",
    importPositions: "/positions/import",
    // Using a function so that we can pass the `":id"` only in rendering route.
    // But for ROUTES_PROTECTED and RouteHandler, we don't pass `id`.
    viewPosition: (id = "") => `/positions/${id}`,
    planAndBilling: "/settings/plan-and-billing",
    brokerAccounts: "/settings/broker-accounts",
    feedbackAndSupport: "/settings/feedback-and-support",
    notificationsPreferences: "/settings/notifications",
};

export const ROUTES_PUBLIC = [ROUTES.index, ROUTES.notFound, ROUTES.signIn];

export const ROUTES_PROTECTED = [
    ROUTES.dashboard,
    ROUTES.listPositions,
    ROUTES.newPositions,
    ROUTES.importPositions,
    ROUTES.viewPosition(),
    ROUTES.planAndBilling,
    ROUTES.brokerAccounts,
    ROUTES.feedbackAndSupport,
    ROUTES.notificationsPreferences,
];

export const PADDLE_PRICE_ID_MONTHLY = import.meta.env.ARTHVEDA_PADDLE_PRICE_ID_MONTHLY;
export const PADDLE_PRICE_ID_YEARLY = import.meta.env.ARTHVEDA_PADDLE_PRICE_ID_YEARLY;
