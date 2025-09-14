import { ErrorMessage, IconCalendarSingle, Loading, LoadingScreen, PageHeading, useDocumentTitle } from "netra";

import { TradingCalendar } from "@/features/calendar/components/trading_calendar";
import { apiHooks } from "@/hooks/api_hooks";
import { useMemo } from "react";

export function Calendar() {
    useDocumentTitle("Calendar • Arthveda");

    const { data, isLoading, isFetching, isError } = apiHooks.calendar.useGetCalendar();

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
            <div className="flex-1">
                <TradingCalendar data={data} />
            </div>
        );
    }, [data, isLoading, isError]);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <IconCalendarSingle size={18} />
                <h1>Calendar</h1>
                {isFetching && <Loading />}
            </PageHeading>

            {content}
        </div>
    );
}

export default Calendar;
