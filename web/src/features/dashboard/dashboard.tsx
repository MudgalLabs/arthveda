import { FC, useMemo, useState } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes_constants";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { CumulativePnLCurve } from "@/features/dashboard/widget/cumulative_pnl_graph";
import { OverviewCard } from "@/features/dashboard/widget/overview_card";
import { WinningCard } from "@/features/dashboard/widget/winning_card";
import { LosingCard } from "@/features/dashboard/widget/losing_card";
import { IconImport, IconPlus, IconSearch } from "@/components/icons";
import { Button, DatePicker } from "@/s8ly";
import { datesArrayToDateRangeFilter } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/card";
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
        i: "cumulative_pnl_curve",
        x: 0,
        y: 5,
        w: 12,
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
        i: "cumulative_pnl_curve",
        x: 0,
        y: 15,
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

        return data.cumulative_pnl.map((d) => ({
            ...d,
            net_pnl: parseFloat(d.net_pnl),
            gross_pnl: parseFloat(d.gross_pnl),
            charges: parseFloat(d.charges),
        }));
    }, [data?.cumulative_pnl]);

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
            return <WelcomeMessageForNewUser />;
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
                        <WinningCard
                            winRate={data.win_rate}
                            winRFactor={data.avg_win_r_factor}
                            maxWin={data.max_win}
                            avgWin={data.avg_win}
                            winStreak={data.win_streak}
                        />
                    </WidgetContainer>
                </div>

                <div key="losing">
                    <WidgetContainer>
                        <LosingCard
                            lossRate={data.loss_rate}
                            lossRFactor={data.avg_loss_r_factor}
                            maxLoss={data.max_loss}
                            avgLoss={data.avg_loss}
                            lossStreak={data.loss_streak}
                        />
                    </WidgetContainer>
                </div>

                <div key="cumulative_pnl_curve">
                    <WidgetContainer>
                        <CumulativePnLCurve data={cumulativePnLData} isResizable />
                    </WidgetContainer>
                </div>
            </ResponsiveGridLayout>
        );
    }, [data, isFetching, isError, layouts, cumulativePnLData, appliedDates.length]);

    return (
        <>
            <PageHeading heading="Dashboard" />

            {!isNewUser && (
                <>
                    <div className="flex-x justify-end">
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
                        />

                        <Button
                            className="size-10"
                            variant="outline"
                            disabled={isFetching}
                            onClick={() => applyFilters()}
                        >
                            <IconSearch size={18} />
                        </Button>
                    </div>

                    <div className="h-4" />
                </>
            )}

            {content}
        </>
    );
};

export default Dashboard;

function WelcomeMessageForNewUser() {
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

                {/* <div className="border-border bg-background-subtle mb-8 rounded-lg border p-6 text-left"> */}
                <Card className="mx-auto w-full max-w-[500px] text-left">
                    <CardTitle className="sub-heading">Get Started</CardTitle>
                    <CardContent className="mt-4 text-base! text-pretty">
                        <p>
                            You haven’t added any{" "}
                            <Link className="text-base!" to={ROUTES.explorePositions}>
                                positions{" "}
                            </Link>
                            yet.
                        </p>

                        <div className="h-4" />

                        <p>You can import positions from your broker or add a position.</p>

                        <div className="h-8" />

                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link to={ROUTES.addPosition}>
                                <Button variant="outline" className="w-full sm:w-fit">
                                    <IconPlus />
                                    Add Position Manually
                                </Button>
                            </Link>
                            <Link to={ROUTES.importPositions}>
                                <Button variant="primary" className="w-full sm:w-fit">
                                    <IconImport />
                                    Import from Broker
                                </Button>
                            </Link>
                        </div>
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
