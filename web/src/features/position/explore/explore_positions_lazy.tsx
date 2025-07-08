import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const ExplorePositions = lazy(() => import("@/features/position/explore/explore_positions"));

const ExplorePositionsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <ExplorePositions />
    </Suspense>
);

export default ExplorePositionsLazy;
