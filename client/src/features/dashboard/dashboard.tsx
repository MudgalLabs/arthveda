import { useMemo } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";

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
import { useLocalStorageState } from "@/hooks/use_local_storage_state";
import { LocalStorageKeyDashboardLayout } from "@/lib/utils";

import { WidgetDragHandle } from "@/features/dashboard/widget/widget";
import { IconArrowDownRight } from "@/components/icons";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

type DashboardLayoutSize = "lg" | "sm";

const lgLayout: Layout[] = [
    {
        i: "overview",
        x: 0,
        y: 0,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "winning",
        x: 4,
        y: 0,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "losing",
        x: 8,
        y: 0,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "cumulative_pnl_curve",
        x: 0,
        y: 5,
        w: 6,
        h: 10,
        minW: 4,
        minH: 10,
    },
];

const smLayout: Layout[] = [
    {
        i: "overview",
        x: 0,
        y: 0,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "winning",
        x: 0,
        y: 5,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "losing",
        x: 0,
        y: 10,
        w: 4,
        h: 4.5,
        minW: 4,
        minH: 4.5,
        isResizable: false,
    },
    {
        i: "cumulative_pnl_curve",
        x: 0,
        y: 15,
        w: 3,
        h: 10,
        minW: 3,
        maxW: 3,
        minH: 10,
    },
];

export const Dashboard = () => {
    const [layouts, setLayouts] = useLocalStorageState<
        Record<DashboardLayoutSize, Layout[]>
    >(LocalStorageKeyDashboardLayout, {
        lg: lgLayout,
        sm: smLayout,
    });

    const { data, isLoading, isFetching, isError } =
        apiHooks.dashboard.useGet();

    const cumulativePnLData = useMemo(() => {
        if (!data) return [];

        return data.cumulative_pnl.map((d) => ({
            ...d,
            net_pnl: parseFloat(d.net_pnl),
            gross_pnl: parseFloat(d.gross_pnl),
            charges: parseFloat(d.charges),
        }));
    }, [data?.cumulative_pnl]);

    if (isError) {
        return (
            <p className="text-foreground-red">Error loading dashboard data.</p>
        );
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!data) return null;

    const grossPnL = data.gross_pnl;
    const netPnL = data.net_pnl;
    const winRate = data.win_rate;

    if (!!grossPnL && !!netPnL && !winRate) {
        return <WelcomeMessageForNewUser />;
    }

    return (
        <div>
            <PageHeading heading="Dashboard" loading={isFetching} />

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
                onLayoutChange={(_, layouts) =>
                    setLayouts(layouts as Record<DashboardLayoutSize, Layout[]>)
                }
                containerPadding={[0, 0]}
                margin={[16, 16]}
                resizeHandles={["se"]}
                resizeHandle={
                    <div className="react-resizable-handle text-foreground-muted hover:text-foreground absolute right-0 bottom-0 cursor-se-resize">
                        <IconArrowDownRight size={16} />
                    </div>
                }
                draggableHandle=".custom-drag-handle"
            >
                <div key="overview">
                    <OverviewCard
                        gross_pnl_amount={data.gross_pnl}
                        net_pnl_amount={data.net_pnl}
                        total_charges_amount={data.charges}
                    />
                    <WidgetDragHandle />
                </div>

                <div key="winning">
                    <WinningCard
                        winRate={data.win_rate}
                        winRFactor={data.avg_win_r_factor}
                        maxWin={data.max_win}
                        avgWin={data.avg_win}
                        winStreak={data.win_streak}
                    />
                    <WidgetDragHandle />
                </div>

                <div key="losing">
                    <LosingCard
                        lossRate={data.loss_rate}
                        lossRFactor={data.avg_loss_r_factor}
                        maxLoss={data.max_loss}
                        avgLoss={data.avg_loss}
                        lossStreak={data.loss_streak}
                    />
                    <WidgetDragHandle />
                </div>

                <div key="cumulative_pnl_curve">
                    <CumulativePnLCurve data={cumulativePnLData} isResizable />
                    <WidgetDragHandle />
                </div>
            </ResponsiveGridLayout>
        </div>
    );
};

export default Dashboard;

function WelcomeMessageForNewUser() {
    const { data } = useAuthentication();

    if (!data) {
        return null;
    }

    return (
        <div className="jusify-center mt-20 flex flex-col items-center">
            <div className="flex flex-col gap-y-4">
                <p>Hey {data.display_name},</p>
                <p>
                    Looks like you are new here and have no{" "}
                    <Link className="text-base!" to={ROUTES.positionList}>
                        positions
                    </Link>{" "}
                    added yet.
                </p>
                <p>
                    Start using Arthveda by{" "}
                    <Link className="text-base!" to={ROUTES.addPosition}>
                        adding
                    </Link>{" "}
                    a position or{" "}
                    <Link className="text-base!" to={ROUTES.importPositions}>
                        importing
                    </Link>{" "}
                    positions from your broker.
                </p>
            </div>
        </div>
    );
}
