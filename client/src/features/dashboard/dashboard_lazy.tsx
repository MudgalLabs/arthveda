import React, { lazy, Suspense } from "react";
import { Loading } from "@/components/loading";

const Dashboard = lazy(() => import("./dashboard"));

const DashboardLazy: React.FC = () => (
    <Suspense fallback={<Loading />}>
        <Dashboard />
    </Suspense>
);

export default DashboardLazy;
