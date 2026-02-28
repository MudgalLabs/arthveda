import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";
import { PositionStoreProvider } from "@/features/position/position_store_context";
import { useHomeCurrency } from "@/features/auth/auth_context";

const NewPosition = lazy(() => import("@/features/position/components/position_log/position_log"));

const NewPositionLazy: React.FC = () => {
    const homeCurrency = useHomeCurrency();

    return (
        <Suspense fallback={<LoadingScreen />}>
            <PositionStoreProvider initState={{ currency: homeCurrency }}>
                <NewPosition />
            </PositionStoreProvider>
        </Suspense>
    );
};

export default NewPositionLazy;
