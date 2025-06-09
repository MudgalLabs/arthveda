export const ROUTES = {
    // Routes that don't require user to be authenticated.
    index: "/",
    notFound: "*",
    signIn: "/sign-in",

    // App routes that will be accessible if a user is signed in.
    dashboard: "/dashboard",
    settings: "/settings",
    // All routes related to Position.
    positionList: "/position/list",
    addPosition: "/position/add",
    importPositions: "/position/import",
    // Using a function so that we can pass the `":id"` only in rendering route.
    // But for ROUTES_PROTECTED and RouteHandler, we don't pass `id`.
    viewPosition: (id = "") => `/position/${id}`,
};

export const ROUTES_PUBLIC = [ROUTES.index, ROUTES.notFound, ROUTES.signIn];

export const ROUTES_PROTECTED = [
    ROUTES.addPosition,
    ROUTES.dashboard,
    ROUTES.importPositions,
    ROUTES.settings,
    ROUTES.positionList,
    ROUTES.viewPosition(),
];
