export const API_ROUTES = {
    auth: {
        signin: "/v1/auth/sign-in",
        signup: "/v1/auth/sign-up",
        signout: "/v1/auth/sign-out",
    },
    broker: {
        list: "/v1/brokers",
    },
    calendar: {
        get: "/v1/calendar",
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
    subscription: {
        cancelSubscriptionAtPeriodEnd: "/v1/subscriptions/me/cancel-at-period-end",
        listUserSubscriptionInvoices: "/v1/subscriptions/me/invoices",
        invoiceDownloadLink: (id: string) => `/v1/subscriptions/me/invoices/${id}/download-link`,
    },
    symbol: {
        search: "/v1/symbols/search",
    },
    tag: {
        list: "/v1/tags",
        createTag: "/v1/tags",
        createGroup: "/v1/tags/groups",
        updateTag: (id: string) => `/v1/tags/${id}`,
        updateGroup: (id: string) => `/v1/tags/groups/${id}`,
        deleteGroup: (id: string) => `/v1/tags/groups/${id}`,
    },
    upload: {
        presign: "/v1/uploads/presign",
    },
    user: {
        me: "/v1/users/me",
    },
    userBrokerAccount: {
        list: "/v1/user-broker-accounts",
        create: "/v1/user-broker-accounts",
        update: (id: string) => `/v1/user-broker-accounts/${id}`,
        delete: (id: string) => `/v1/user-broker-accounts/${id}`,
        connect: (id: string) => `/v1/user-broker-accounts/${id}/connect`,
        disconnect: (id: string) => `/v1/user-broker-accounts/${id}/disconnect`,
        sync: (id: string) => `/v1/user-broker-accounts/${id}/sync`,
    },
};
