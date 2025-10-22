import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Analytics = lazy(() => import("@/features/analytics/analytics"));

const AnalyticsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Analytics />
    </Suspense>
);

export default AnalyticsLazy;
