import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const Calendar = lazy(() => import("@/features/calendar/calendar"));

const CalendarLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <Calendar />
    </Suspense>
);

export default CalendarLazy;
