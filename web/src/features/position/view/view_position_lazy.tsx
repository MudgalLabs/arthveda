import { Suspense, lazy } from "react";
import { useParams } from "react-router-dom";

import { PositionStoreProvider } from "@/features/position/position_store_context";
import { LoadingScreen } from "@/components/loading_screen";
import { apiHooks } from "@/hooks/api_hooks";

const ViewPosition = lazy(() => import("@/features/position/view/view_position"));

const ViewPositionLazy = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, isError } = apiHooks.position.useGetPosition(id!);

    if (isError) {
        return <p className="text-text-destructive">Error loading position</p>;
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (data) {
        const position = data.data.position;
        position.trades = (position.trades ?? []).map((trade) => {
            trade.time = new Date(trade.time);
            return trade;
        });

        position.opened_at = new Date(position.opened_at);
        position.closed_at = position.closed_at ? new Date(position.closed_at) : null;

        return (
            <Suspense fallback={<LoadingScreen />}>
                <PositionStoreProvider initState={position}>
                    <ViewPosition />
                </PositionStoreProvider>
            </Suspense>
        );
    }

    return <p className="text-text-destructive">Failed to fetch position</p>;
};

export default ViewPositionLazy;
