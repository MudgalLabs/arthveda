import React, { lazy, Suspense } from "react";
import { Loading } from "@/components/loading";

const ListPositions = lazy(() => import("./list_positions"));

const ListPositionsLazy: React.FC = () => (
    <Suspense fallback={<Loading />}>
        <ListPositions />
    </Suspense>
);

export default ListPositionsLazy;
