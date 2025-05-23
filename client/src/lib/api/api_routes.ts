export const API_ROUTES = {
    auth: {
        signin: "/v1/auth/sign-in",
        signup: "/v1/auth/sign-up",
        signout: "/v1/auth/sign-out",
    },
    currency: {
        list: "/v1/currencies",
    },
    dashboard: {
        get: "/v1/dashboard",
    },
    position: {
        create: "/v1/positions",
        compute: "/v1/positions/compute",
        search: "/v1/positions/search",
    },
    user: {
        me: "/v1/users/me",
    },
};
