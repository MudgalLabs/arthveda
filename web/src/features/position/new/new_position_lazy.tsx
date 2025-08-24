import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";
import { PositionStoreProvider } from "@/features/position/position_store_context";

const NewPosition = lazy(() => import("@/features/position/new/new_position"));

const NewPositionLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <PositionStoreProvider>
            <NewPosition />
        </PositionStoreProvider>
    </Suspense>
);

export default NewPositionLazy;
