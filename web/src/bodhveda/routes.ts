export const ROUTES = {
    recipients: {
        notifications: {
            list: (recipientID: string) => `/recipients/${recipientID}/notifications`,
            unreadCount: (recipientID: string) => `/recipients/${recipientID}/notifications/unread-count`,
            udpateState: (recipientID: string) => `/recipients/${recipientID}/notifications`,
            delete: (recipientID: string) => `/recipients/${recipientID}/notifications`,
        },
        preferences: {
            list: (recipientID: string) => `/recipients/${recipientID}/preferences`,
            set: (recipientID: string) => `/recipients/${recipientID}/preferences`,
            check: (recipientID: string) => `/recipients/${recipientID}/preferences/check`,
        },
    },
};
