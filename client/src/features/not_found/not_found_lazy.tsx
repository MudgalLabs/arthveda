import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const NotFound = lazy(() => import("@/features/not_found/not_found"));

const NotFoundLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <NotFound />
    </Suspense>
);

export default NotFoundLazy;
