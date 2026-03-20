import { FC, useMemo, useState } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { PageHeading, Button, DatePicker, IconDashboard, useDocumentTitle } from "netra";
import Decimal from "decimal.js";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { apiHooks } from "@/hooks/api_hooks";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { WidgetCumulativePnLGraph } from "@/features/dashboard/widget/widget_cumulative_pnl_graph";
import { IconSearch } from "@/components/icons";
import { datesArrayToDateRangeFilter } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/card";
import { WidgetPnLGraph } from "@/features/dashboard/widget/widget_pnl_graph";
import { FreePlanLimitTag } from "@/components/free_plan_limit_tag";
import { WidgetPnLCard } from "@/features/dashboard/widget/widget_pnl_card";
import { WidgetAvgWinLoss } from "@/features/dashboard/widget/widget_avg_win_loss";
import { AvgWinRate } from "@/features/dashboard/widget/widget_win_rate";
import { WidgetProfitFactor } from "./widget/widget_profit_factor";
import { WidgetExpectancy } from "./widget/widget_expectancy";
import { WidgetStreak } from "./widget/widget_streak";
// import { useLocalStorageState } from "@/hooks/use_local_storage_state";
// import { LocalStorageKeyDashboardLayout } from "@/lib/utils";

type DashboardLayoutSize = "lg" | "md" | "sm";

const lgLayout: Layout[] = [
    // Row 1
    { i: "net_pnl", x: 0, y: 0, w: 4, h: 4 },
    { i: "win_rate", x: 4, y: 0, w: 4, h: 4 },
    { i: "avg_win_loss", x: 8, y: 0, w: 4, h: 4 },
    { i: "expectancy", x: 9, y: 0, w: 3, h: 3 },

    // Row 2
    { i: "cumulative_pnl_graph", x: 0, y: 4, w: 9, h: 10 },
    { i: "profit_factor", x: 9, y: 4, w: 3, h: 3 },
    { i: "streak", x: 9, y: 8, w: 3, h: 4 },

    // Row 3
    { i: "pnl_graph", x: 0, y: 12, w: 12, h: 10 },
];

const mdLayout: Layout[] = [
    { i: "net_pnl", x: 0, y: 0, w: 3, h: 4 },
    { i: "win_rate", x: 4, y: 0, w: 3, h: 4 },
    { i: "avg_win_loss", x: 0, y: 4, w: 3, h: 4 },
    { i: "expectancy", x: 4, y: 4, w: 3, h: 4 },

    { i: "profit_factor", x: 0, y: 8, w: 3, h: 4 },
    { i: "streak", x: 4, y: 8, w: 3, h: 4 },

    { i: "cumulative_pnl_graph", x: 0, y: 16, w: 6, h: 10 },
    { i: "pnl_graph", x: 0, y: 26, w: 6, h: 10 },
];

const smLayout: Layout[] = [
    { i: "net_pnl", x: 0, y: 0, w: 4, h: 4 },
    { i: "win_rate", x: 0, y: 5, w: 4, h: 4 },
    { i: "avg_win_loss", x: 0, y: 9, w: 4, h: 4 },
    { i: "expectancy", x: 0, y: 13, w: 4, h: 4 },
    { i: "profit_factor", x: 0, y: 17, w: 4, h: 4 },
    { i: "streak", x: 0, y: 21, w: 4, h: 4 },
    { i: "cumulative_pnl_graph", x: 0, y: 25, w: 4, h: 8 },
    { i: "pnl_graph", x: 0, y: 33, w: 4, h: 8 },
];

export const Dashboard = () => {
    useDocumentTitle("Dashboard • Arthveda");

    const [layouts, setLayouts] = useState<Record<DashboardLayoutSize, Layout[]>>({
        lg: lgLayout,
        md: mdLayout,
        sm: smLayout,
    });
    const [dates, setDates] = useState<Date[]>([]);
    const [appliedDates, setAppliedDates] = useState<Date[]>([]);

    const { data, isFetching, isError } = apiHooks.dashboard.useGetDashboard({
        date_range: datesArrayToDateRangeFilter(appliedDates),
    });
    const { data: userMeData } = apiHooks.user.useMe();

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

    const content = useMemo(() => {
        if (isError) {
            return <p className="text-text-destructive">Error loading dashboard data.</p>;
        }

        if (isFetching) {
            return (
                <div>
                    <LoadingScreen className="mt-20" />
                </div>
            );
        }

        if (!data) return null;

        if (!userMeData || !userMeData.data.total_positions) {
            return <GetStarted />;
        }

        return (
            <>
                <ResponsiveGridLayout
                    className="complex-interface-layout"
                    layouts={layouts}
                    breakpoints={{
                        lg: 1200,
                        md: 768,
                        sm: 0,
                    }}
                    cols={{
                        lg: 12,
                        md: 6,
                        sm: 4,
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
                    <div key="net_pnl">
                        <WidgetContainer>
                            {/* <OverviewCard
                                gross_pnl_amount={data.gross_pnl}
                                net_pnl_amount={data.net_pnl}
                                total_charges_amount={data.charges}
                                r_factor={data.avg_r_factor}
                                gross_r_factor={data.avg_gross_r_factor}
                            /> */}
                            <WidgetPnLCard
                                gross={new Decimal(data.gross_pnl)}
                                net={new Decimal(data.net_pnl)}
                                charges={new Decimal(data.charges)}
                            />
                        </WidgetContainer>
                    </div>

                    <div key="profit_factor">
                        <WidgetContainer>
                            <WidgetProfitFactor profitFactor={new Decimal(data.profit_factor)} />
                        </WidgetContainer>
                    </div>

                    <div key="expectancy">
                        <WidgetContainer>
                            <WidgetExpectancy expectancy={new Decimal(data.expectancy)} />
                        </WidgetContainer>
                    </div>

                    <div key="win_rate">
                        <WidgetContainer>
                            <AvgWinRate
                                winRate={data.win_rate}
                                totalTradesCount={data.total_trades_count}
                                winsCount={data.wins_count}
                                lossesCount={data.losses_count}
                                breakevensCount={data.breakevens_count}
                            />
                        </WidgetContainer>
                    </div>

                    <div key="avg_win_loss">
                        <WidgetContainer>
                            <WidgetAvgWinLoss
                                avgWin={new Decimal(data.avg_win)}
                                avgLoss={new Decimal(data.avg_loss)}
                                ratio={new Decimal(data.avg_win_loss_ratio)}
                            />
                        </WidgetContainer>
                    </div>

                    <div key="streak">
                        <WidgetContainer>
                            <WidgetStreak winStreak={data.win_streak} lossStreak={data.loss_streak} />
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

                <div className="h-12" />
            </>
        );
    }, [data, isFetching, isError, layouts, cumulativePnLData, appliedDates.length]);

    return (
        <div>
            <PageHeading>
                <IconDashboard size={18} />
                <h1>Dashboard</h1>
            </PageHeading>

            {!isFetching && (userMeData?.data.total_positions || 0) > 0 && (
                <div className="space-y-4">
                    <FreePlanLimitTag />

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

                <Card className="mx-auto w-full max-w-[500px] text-left">
                    <CardTitle>Get Started</CardTitle>
                    <CardContent className="mt-4 space-y-4 text-pretty">
                        <p>
                            To get started, use the <strong>"+ Positions"</strong> button in the sidebar. You can:
                        </p>

                        <ul className="text-muted-foreground list-inside list-disc">
                            <li>Add a position manually</li>
                            <li>Import and/or import from a broker</li>
                        </ul>

                        <p className="text-muted-foreground">
                            Once positions with realised PnL are added, you’ll have analytics here.
                        </p>
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
