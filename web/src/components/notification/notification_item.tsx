import { Button, cn, formatTimeAgo, IconCross, IconMegaphone } from "netra";

import { Notification, Target } from "@/bodhveda/types";
import { useMemo } from "react";
import { useDeleteNotifications, useUpdateNotificationsState } from "@/bodhveda/react";

const enum NotificationKind {
    ANNOUNECEMENT_NEW_FEATURE = "announcement_new_feature",
}

const NotificationTargetToKindMap: Record<NotificationKind, Target> = {
    [NotificationKind.ANNOUNECEMENT_NEW_FEATURE]: {
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
    const { mutate: deleteNotifications, isPending: isDeleting } = useDeleteNotifications();

    const notificationContent = useMemo(() => {
        switch (kind) {
            case NotificationKind.ANNOUNECEMENT_NEW_FEATURE:
                return <AnnouncementNewFeatureNotification notification={notification} />;
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

            <Button
                className="absolute top-2 right-1 size-5 rounded-full p-0"
                variant="secondary"
                onClick={() =>
                    deleteNotifications({
                        ids: [notification.id],
                    })
                }
                disabled={isDeleting}
            >
                <IconCross size={12} />
            </Button>

            {notificationContent}
        </div>
    );
}

interface AnnouncementNewFeatureNotificationPayload {
    title: string;
    description: string;
    url?: string;
}

function AnnouncementNewFeatureNotification({ notification }: { notification: Notification }) {
    const payload = notification.payload as AnnouncementNewFeatureNotificationPayload;

    return (
        <a href={payload.url} className="link-unstyled">
            <div className={cn("p-4", { "hover:bg-hover-soft cursor-pointer!": !!payload.url })}>
                <div className="flex items-start">
                    <div className="bg-azure-900 rounded-full p-1">
                        <IconMegaphone size={24} />
                    </div>

                    <div className="space-y-2 pl-4">
                        <p className="text-sm font-medium">{payload.title}</p>

                        <p className="bg-azure-900 rounded-md px-2 py-3 text-[13px]">{payload.description}</p>
                    </div>
                </div>
            </div>
        </a>
    );
}
