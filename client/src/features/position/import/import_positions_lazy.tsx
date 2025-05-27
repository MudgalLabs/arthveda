import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const ImportPositions = lazy(
    () => import("@/features/position/import/import_positions")
);

const ImportPositionsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <ImportPositions />
    </Suspense>
);

export default ImportPositionsLazy;
