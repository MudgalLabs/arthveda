import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Insights = lazy(() => import("@/features/insights/insights"));

const InsightsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Insights />
    </Suspense>
);

export default InsightsLazy;
