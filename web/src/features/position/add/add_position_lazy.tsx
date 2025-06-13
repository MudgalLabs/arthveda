import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";
import { PositionStoreProvider } from "@/features/position/position_store_context";

const AddPosition = lazy(() => import("@/features/position/add/add_position"));

const AddPositionLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <PositionStoreProvider>
            <AddPosition />
        </PositionStoreProvider>
    </Suspense>
);

export default AddPositionLazy;
