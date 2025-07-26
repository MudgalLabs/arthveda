export const ROUTES = {
    // Routes that don't require user to be authenticated.
    index: "/",
    notFound: "*",
    signIn: "/sign-in",

    // App routes that will be accessible if a user is signed in.
    dashboard: "/dashboard",
    // All routes related to Position.
    explorePositions: "/position/explore",
    addPosition: "/position/add",
    importPositions: "/position/import",
    // Using a function so that we can pass the `":id"` only in rendering route.
    // But for ROUTES_PROTECTED and RouteHandler, we don't pass `id`.
    viewPosition: (id = "") => `/position/${id}`,
    subscription: "/settings/subscription",
    brokerAccounts: "/settings/broker-accounts",
    feedbackAndSupport: "/settings/feedback-and-support",
};

export const ROUTES_PUBLIC = [ROUTES.index, ROUTES.notFound, ROUTES.signIn];

export const ROUTES_PROTECTED = [
    ROUTES.addPosition,
    ROUTES.dashboard,
    ROUTES.explorePositions,
    ROUTES.importPositions,
    ROUTES.viewPosition(),
    ROUTES.subscription,
    ROUTES.brokerAccounts,
    ROUTES.feedbackAndSupport,
];

export const PADDLE_PRICE_ID_MONTHLY = import.meta.env.ARTHVEDA_PADDLE_PRICE_ID_MONTHLY;
export const PADDLE_PRICE_ID_YEARLY = import.meta.env.ARTHVEDA_PADDLE_PRICE_ID_YEARLY;
