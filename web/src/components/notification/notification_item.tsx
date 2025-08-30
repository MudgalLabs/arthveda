import { useMemo } from "react";
import { cn, formatTimeAgo, IconMegaphone } from "netra";
import { Notification, Target } from "bodhveda";
import { useUpdateNotificationsState } from "@bodhveda/react";

const enum NotificationKind {
    MARKETING_WELCOME = "marketing_welcome",
    MARKETING_NEW_FEATURE = "marketing_new_feature",
}

const NotificationTargetToKindMap: Record<NotificationKind, Target> = {
    [NotificationKind.MARKETING_WELCOME]: {
        channel: "marketing",
        topic: "none",
        event: "welcome",
    },
    [NotificationKind.MARKETING_NEW_FEATURE]: {
        channel: "announcements",
        topic: "product",
        event: "new_feature",
    },
};

function getNotificationKind(notification: Notification): NotificationKind | null {
    for (const kind in NotificationTargetToKindMap) {
        const target = NotificationTargetToKindMap[kind as NotificationKind];
        if (
            notification.target.channel === target.channel &&
            notification.target.topic === target.topic &&
            notification.target.event === target.event
        ) {
            return kind as NotificationKind;
        }
    }

    return null;
}

export function NotificationItem({ notification }: { notification: Notification }) {
    const kind = useMemo(() => getNotificationKind(notification), [notification]);
    const { mutate: updateNotificationState } = useUpdateNotificationsState();

    const notificationContent = useMemo(() => {
        switch (kind) {
            case NotificationKind.MARKETING_WELCOME:
                return <MarketingWelcomeNotification notification={notification} />;
            case NotificationKind.MARKETING_NEW_FEATURE:
                return <MarketingNewFeatureNotification notification={notification} />;
            default:
                return null;
        }
    }, [kind, notification]);

    return (
        <div
            className={cn("border-border-soft relative overflow-hidden border-b-1", {
                "bg-primary/20": !notification.state.read,
            })}
            onClick={() => {
                updateNotificationState({
                    ids: [notification.id],
                    state: { read: true },
                });
            }}
        >
            {!notification.state.read && <div className="bg-accent absolute top-2 left-1 size-2 rounded-full" />}

            {notificationContent}
        </div>
    );
}

interface MarketingWelcomeNotificationPayload {
    title: string;
    body: string;
}

function MarketingWelcomeNotification({ notification }: { notification: Notification }) {
    const payload = notification.payload as MarketingWelcomeNotificationPayload;

    return (
        <div className="p-4">
            <div className="flex items-start">
                <div className="bg-azure-900 rounded-full p-1">
                    <IconMegaphone size={24} />
                </div>

                <div className="pl-4">
                    <p className="mb-1 text-sm font-medium">{payload.title}</p>

                    <p className="text-text-muted mb-2 text-xs">{formatTimeAgo(new Date(notification.created_at))}</p>

                    <p className="bg-azure-900 rounded-md px-2 py-3 text-[13px]">{payload.body}</p>
                </div>
            </div>
        </div>
    );
}

interface MarketingNewFeatureNotificationPayload {
    title: string;
    description: string;
    url: string;
}

function MarketingNewFeatureNotification({ notification }: { notification: Notification }) {
    const payload = notification.payload as MarketingNewFeatureNotificationPayload;

    return (
        <a href={payload.url} className="link-unstyled">
            <div className={cn("p-4", { "hover:bg-hover-soft cursor-pointer!": !!payload.url })}>
                <div className="flex items-start">
                    <div className="bg-azure-900 rounded-full p-1">
                        <IconMegaphone size={24} />
                    </div>

                    <div className="pl-4">
                        <p className="mb-1 text-sm font-medium">{payload.title}</p>

                        <p className="text-text-muted mb-2 text-xs">
                            {formatTimeAgo(new Date(notification.created_at))}
                        </p>

                        <p className="bg-azure-900 rounded-md px-2 py-3 text-[13px]">{payload.description}</p>
                    </div>
                </div>
            </div>
        </a>
    );
}
