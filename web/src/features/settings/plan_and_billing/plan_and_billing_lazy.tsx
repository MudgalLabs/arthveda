import React, { lazy, Suspense } from "react";

import { LoadingScreen } from "@/components/loading_screen";
const PlanAndBilling = lazy(() => import("@/features/settings/plan_and_billing/plan_and_billing"));

const PlanAndBillingLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <PlanAndBilling />
    </Suspense>
);

export default PlanAndBillingLazy;
