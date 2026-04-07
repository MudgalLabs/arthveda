import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Reports = lazy(() => import("@/features/reports/reports"));

const ReportsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Reports />
    </Suspense>
);

export default ReportsLazy;
