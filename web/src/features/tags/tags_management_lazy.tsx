import React, { lazy, Suspense } from "react";

import { LoadingScreen } from "@/components/loading_screen";
const TagsManagement = lazy(() => import("@/features/tags/tags_management"));

const TagsManagementLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <TagsManagement />
    </Suspense>
);

export default TagsManagementLazy;
