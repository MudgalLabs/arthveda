export const API_ROUTES = {
    auth: {
        refresh: "/v1/auth/refresh",
    },
    broker: {
        list: "/v1/brokers",
    },
    currency: {
        list: "/v1/currencies",
    },
    dashboard: {
        get: "/v1/dashboard",
    },
    position: {
        create: "/v1/positions",
        get: (id: string) => `/v1/positions/${id}`,
        update: (id: string) => `/v1/positions/${id}`,
        deletePosition: (id: string) => `/v1/positions/${id}`,
        compute: "/v1/positions/compute",
        import: "/v1/positions/import",
        search: "/v1/positions/search",
    },
    user: {
        me: "/v1/users/me",
    },
};
