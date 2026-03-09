import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Onboarding = lazy(() => import("@/features/onboarding/onboarding"));

const OnboardingLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Onboarding />
    </Suspense>
);

export default OnboardingLazy;
