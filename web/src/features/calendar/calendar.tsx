import { useMemo } from "react";

import {
    ErrorMessage,
    IconCalendarSingle,
    Loading,
    LoadingScreen,
    PageHeading,
    useDocumentTitle,
    useIsMobile,
    useLocalStorageState,
} from "netra";

import { TradingCalendar } from "@/features/calendar/components/trading_calendar";
import { apiHooks } from "@/hooks/api_hooks";
import { FreePlanLimitTag } from "@/components/free_plan_limit_tag";
import { LocalStorageKeyCalendarPerfViewMode } from "@/lib/utils";
import { CalendarPerfModeSelect, CalendarPerfViewMode } from "@/features/calendar/components/calendar_perf_view_select";

export function Calendar() {
    useDocumentTitle("Calendar • Arthveda");

    const [perfViewMode, setPerfViewMode] = useLocalStorageState(
        LocalStorageKeyCalendarPerfViewMode,
        CalendarPerfViewMode.GROSS_PNL
    );

    const { data, isLoading, isFetching, isError } = apiHooks.calendar.useGetCalendarAll();
    const isMobile = useIsMobile();

    const content = useMemo(() => {
        if (isError) {
            return <ErrorMessage errorMsg="Error loading calendar" />;
        }

        if (isLoading) {
            return <LoadingScreen />;
        }

        if (!data) {
            return null;
        }

        return (
            <div className="flex-1 space-y-2">
                <FreePlanLimitTag />

                <TradingCalendar data={data} perfViewMode={perfViewMode} shrinkedView={isMobile} />
            </div>
        );
    }, [data, isLoading, isError, isMobile, perfViewMode]);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <div className="flex-center w-full justify-between">
                    <div className="flex-x">
                        <IconCalendarSingle size={18} />
                        <h1>Calendar</h1>
                        {isFetching && <Loading />}
                    </div>

                    <CalendarPerfModeSelect value={perfViewMode} onValueChange={setPerfViewMode} />
                </div>
            </PageHeading>

            {content}
        </div>
    );
}

export default Calendar;
