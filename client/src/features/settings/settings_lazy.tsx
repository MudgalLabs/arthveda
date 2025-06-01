import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Settings = lazy(() => import("@/features/settings/settings"));

const SettingsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Settings />
    </Suspense>
);

export default SettingsLazy;
