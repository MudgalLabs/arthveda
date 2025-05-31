import { Suspense, lazy } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const ViewPosition = lazy(
    () => import("@/features/position/view/view_position")
);

const ViewPositionLazy = () => {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ViewPosition />
        </Suspense>
    );
};

export default ViewPositionLazy;
