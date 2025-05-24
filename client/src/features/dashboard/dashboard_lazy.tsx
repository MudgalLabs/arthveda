import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Dashboard = lazy(() => import("./dashboard"));

const DashboardLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Dashboard />
    </Suspense>
);

export default DashboardLazy;
