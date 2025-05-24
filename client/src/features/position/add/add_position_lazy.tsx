import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const AddPosition = lazy(() => import("./add_position"));

const AddPositionLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <AddPosition />
    </Suspense>
);

export default AddPositionLazy;
