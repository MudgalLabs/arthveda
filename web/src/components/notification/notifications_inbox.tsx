import { useCallback, useMemo } from "react";
import { Button, IconCheckCheck, IconSettings, LoadingScreen } from "netra";

import { ROUTES } from "@/constants";
import { Link } from "@/components/link";
import { useNotifications, useNotificationsUnreadCount, useUpdateNotificationsState } from "@/bodhveda/react/hooks";
import { NotificationItem } from "./notification_item";

interface NotificationsInboxProps {
    closeNotifications?: () => void;
}

export function NotificationsInbox(props: NotificationsInboxProps) {
    const { closeNotifications } = props;
    useNotificationsUnreadCount();
    const { data, isLoading, isError } = useNotifications();
    const { mutate: updateNotificationState, isPending: isUpdatingNotificationState } = useUpdateNotificationsState();

    const handleMarkAllAsRead = useCallback(() => {
        updateNotificationState({
            ids: [],
            state: { read: true },
        });
    }, []);

    const renderNotifications = useMemo(() => {
        if (isError) {
            return <p className="text-text-destructive">Failed to load notifications. Please try again.</p>;
        }

        if (isLoading) {
            return <LoadingScreen />;
        }

        if (!data || data.notifications.length === 0) {
            return (
                <div className="flex-center h-full">
                    <p className="text-text-subtle text-sm">No notifications yet, stay tuned!</p>
                </div>
            );
        }

        return (
            <ul>
                {data?.notifications.map((notification) => (
                    <li key={notification.id}>
                        <NotificationItem notification={notification} />
                    </li>
                ))}
            </ul>
        );
    }, [data, isError, isLoading]);

    return (
        <div className="flex h-full w-full flex-col overflow-clip">
            <div className="flex-x sticky top-0 z-100! flex-shrink-0 justify-between p-2">
                <h1 className="text-[16px] font-medium">Notifications</h1>

                <div className="space-x-1">
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={handleMarkAllAsRead}
                        loading={isUpdatingNotificationState}
                    >
                        <IconCheckCheck size={16} />
                        <span className="text-xs">Mark all as read</span>
                    </Button>

                    <Link to={ROUTES.notificationsPreferences} onClick={() => closeNotifications?.()}>
                        <Button size="icon" variant="ghost">
                            <IconSettings size={18} />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">{renderNotifications}</div>
        </div>
    );
}
