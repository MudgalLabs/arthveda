import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";
import { AddPositionProvider } from "@/features/position/add/add_position_context";

const AddPosition = lazy(() => import("@/features/position/add/add_position"));

const AddPositionLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <AddPositionProvider>
            <AddPosition />
        </AddPositionProvider>
    </Suspense>
);

export default AddPositionLazy;
