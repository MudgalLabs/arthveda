import { FC, useMemo, useState } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { WidgetCumulativePnLGraph } from "@/features/dashboard/widget/widget_cumulative_pnl_graph";
import { OverviewCard } from "@/features/dashboard/widget/widget_overview_card";
import { WidgetGeneralStats } from "@/features/dashboard/widget/widget_general_stats";
import { IconSearch } from "@/components/icons";
import { Button, DatePicker } from "@/s8ly";
import { datesArrayToDateRangeFilter } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/card";
import { WidgetPnLGraph } from "./widget/widget_pnl_graph";
// import { useLocalStorageState } from "@/hooks/use_local_storage_state";
// import { LocalStorageKeyDashboardLayout } from "@/lib/utils";

type DashboardLayoutSize = "lg" | "sm";

const lgLayout: Layout[] = [
    {
        i: "overview",
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
        static: true,
    },
    {
        i: "winning",
        x: 4,
        y: 0,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
    },
    {
        i: "losing",
        x: 8,
        y: 0,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
    },
    {
        i: "cumulative_pnl_graph",
        x: 0,
        y: 5,
        w: 6,
        h: 10,
        minW: 4,
        minH: 7,
    },
    {
        i: "pnl_graph",
        x: 6,
        y: 5,
        w: 6,
        h: 10,
        minW: 4,
        minH: 7,
    },
];

const smLayout: Layout[] = [
    {
        i: "overview",
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
    },
    {
        i: "winning",
        x: 0,
        y: 5,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
    },
    {
        i: "losing",
        x: 0,
        y: 10,
        w: 4,
        h: 4,
        minW: 3,
        minH: 4,
    },
    {
        i: "cumulative_pnl_graph",
        x: 0,
        y: 15,
        w: 3,
        h: 7,
        minW: 4,
        maxW: 4,
        minH: 7,
    },
    {
        i: "pnl_graph",
        x: 0,
        y: 23,
        w: 3,
        h: 7,
        minW: 4,
        maxW: 4,
        minH: 7,
    },
];

export const Dashboard = () => {
    const [layouts, setLayouts] = useState<Record<DashboardLayoutSize, Layout[]>>({
        lg: lgLayout,
        sm: smLayout,
    });
    const [dates, setDates] = useState<Date[]>([]);
    const [appliedDates, setAppliedDates] = useState<Date[]>([]);

    const { data, isFetching, isError } = apiHooks.dashboard.useGet({
        date_range: datesArrayToDateRangeFilter(appliedDates),
    });

    const cumulativePnLData = useMemo(() => {
        if (!data) return [];

        return data.cumulative_pnl_buckets.map((d) => ({
            ...d,
            net_pnl: parseFloat(d.net_pnl),
            gross_pnl: parseFloat(d.gross_pnl),
            charges: parseFloat(d.charges),
        }));
    }, [data?.cumulative_pnl_buckets]);

    const pnlData = useMemo(() => {
        if (!data) return [];

        return data.pnl_buckets.map((d) => ({
            ...d,
            net_pnl: parseFloat(d.net_pnl),
            gross_pnl: parseFloat(d.gross_pnl),
            charges: parseFloat(d.charges),
        }));
    }, [data?.pnl_buckets]);

    const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

    const applyFilters = () => {
        setAppliedDates(dates);
    };

    const isNewUser = useMemo(() => {
        // No filters applied and no positions count means it's a new user.
        return appliedDates.length === 0 && data?.positions_count === 0;
    }, [appliedDates.length, data?.positions_count]);

    const content = useMemo(() => {
        if (isError) {
            return <p className="text-foreground-red">Error loading dashboard data.</p>;
        }

        if (isFetching) {
            return (
                <div>
                    <LoadingScreen className="mt-20" />
                </div>
            );
        }

        if (!data) return null;

        if (isNewUser) {
            return <GetStarted />;
        }

        return (
            <ResponsiveGridLayout
                className="complex-interface-layout"
                layouts={layouts}
                breakpoints={{
                    lg: 1200,
                    sm: 0,
                }}
                cols={{
                    lg: 12,
                    sm: 3,
                }}
                rowHeight={30}
                width={1440}
                onLayoutChange={(_, layouts) => setLayouts(layouts as Record<DashboardLayoutSize, Layout[]>)}
                containerPadding={[0, 0]}
                margin={[16, 16]}
                resizeHandles={["se"]}
                // @ts-ignore - The types from react-grid-layout are not fully accurate with the current version.
                resizeHandle={(handleAxis, ref) => {
                    // Disabling the resize handle for now until we have better way to store the layout.
                    return <div></div>;

                    // if (handleAxis === "se") {
                    //     return (
                    //         <div
                    //             ref={ref}
                    //             key="se"
                    //             className="text-accent absolute right-0 bottom-0 cursor-se-resize rounded-sm"
                    //         >
                    //             <IconChevronDownRight size={18} />
                    //         </div>
                    //     );
                    // }
                }}
                draggableHandle=".custom-drag-handle"
            >
                <div key="overview">
                    <WidgetContainer>
                        <OverviewCard
                            gross_pnl_amount={data.gross_pnl}
                            net_pnl_amount={data.net_pnl}
                            total_charges_amount={data.charges}
                            r_factor={data.avg_r_factor}
                        />
                    </WidgetContainer>
                </div>

                <div key="winning">
                    <WidgetContainer>
                        <WidgetGeneralStats
                            isWinning
                            rate={data.win_rate}
                            rFactor={data.avg_win_r_factor}
                            max={data.max_win}
                            avg={data.avg_win}
                            streak={data.win_streak}
                        />
                    </WidgetContainer>
                </div>

                <div key="losing">
                    <WidgetContainer>
                        <WidgetGeneralStats
                            isWinning={false}
                            rate={data.loss_rate}
                            rFactor={data.avg_loss_r_factor}
                            max={data.max_loss}
                            avg={data.avg_loss}
                            streak={data.loss_streak}
                        />
                    </WidgetContainer>
                </div>

                <div key="cumulative_pnl_graph">
                    <WidgetContainer>
                        <WidgetCumulativePnLGraph data={cumulativePnLData} isResizable />
                    </WidgetContainer>
                </div>

                <div key="pnl_graph">
                    <WidgetContainer>
                        <WidgetPnLGraph data={pnlData} isResizable />
                    </WidgetContainer>
                </div>
            </ResponsiveGridLayout>
        );
    }, [data, isFetching, isError, layouts, cumulativePnLData, appliedDates.length]);

    return (
        <div>
            <PageHeading heading="Dashboard" />

            {!isNewUser && (
                <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="flex-x">
                        <DatePicker
                            className="w-full sm:w-fit"
                            placeholder="Select date range"
                            mode="range"
                            dates={dates}
                            onDatesChange={setDates}
                            config={{
                                dates: {
                                    toggle: true,
                                    maxDate: new Date(),
                                },
                            }}
                            popoverContentProps={{ align: "start" }}
                        />

                        <Button variant="secondary" disabled={isFetching} onClick={() => applyFilters()}>
                            <IconSearch size={18} />
                        </Button>
                    </div>
                </div>
            )}

            {content}
        </div>
    );
};

export default Dashboard;

function GetStarted() {
    const { data } = useAuthentication();

    if (!data) {
        return null;
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="mx-auto max-w-2xl text-center">
                <div className="mb-8">
                    <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                        👋 Welcome to Arthveda<span className="hidden sm:inline">, {data.name}</span>
                    </h1>
                    <div className="h-2" />
                    <p className="text-foreground-muted text-lg"></p>
                </div>

                <div className="h-8" />

                <Card className="mx-auto w-full max-w-[500px] border-none bg-transparent text-left">
                    <CardTitle>Get Started</CardTitle>
                    <CardContent className="mt-4 space-y-4 text-pretty">
                        <p>
                            To get started, use the <strong>"Add Position"</strong> button in the sidebar. You can:
                        </p>

                        <ul className="text-muted-foreground list-inside list-disc">
                            <li>Add a position manually</li>
                            <li>Import from a broker file</li>
                            <li>Sync from a connected broker</li>
                        </ul>

                        <p className="text-muted-foreground">Once added, you’ll have trading analytics here.</p>
                    </CardContent>
                </Card>
                {/* </div> */}
            </div>
        </div>
    );
}

interface WidgetContainerProps {
    children?: React.ReactNode;
}

const WidgetContainer: FC<WidgetContainerProps> = ({ children }) => {
    // Disabling the drag handle for now until we have better way to store the layout.
    return children;

    // return (
    //     <div className="relative h-full w-full">
    //         {children}
    //         <div className="custom-drag-handle text-accent absolute top-1 right-0 cursor-move">
    //             <IconGripVertical size={16} />
    //         </div>
    //     </div>
    // );
};
