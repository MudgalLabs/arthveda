import React, { lazy, Suspense } from "react";

import { LoadingScreen } from "@/components/loading_screen";
const Subscription = lazy(() => import("@/features/settings/subscription/subscription"));

const SubscriptionLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Subscription />
    </Suspense>
);

export default SubscriptionLazy;
