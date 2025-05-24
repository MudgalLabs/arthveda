import React, { lazy, Suspense } from "react";
import { Loading } from "@/components/loading";

const AddPosition = lazy(() => import("./add_position"));

const AddPositionLazy: React.FC = () => (
    <Suspense fallback={<Loading />}>
        <AddPosition />
    </Suspense>
);

export default AddPositionLazy;
