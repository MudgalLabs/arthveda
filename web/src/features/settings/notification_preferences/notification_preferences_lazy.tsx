import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const NotificationsPreferences = lazy(
    () => import("@/features/settings/notification_preferences/notification_preferences")
);

const NotificationPreferencesLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <NotificationsPreferences />
    </Suspense>
);

export default NotificationPreferencesLazy;
