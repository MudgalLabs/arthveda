import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const ListPositions = lazy(() => import("./list_positions"));

const ListPositionsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <ListPositions />
    </Suspense>
);

export default ListPositionsLazy;
