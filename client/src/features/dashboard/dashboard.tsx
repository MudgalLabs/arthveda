import { useMemo } from "react";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { cn, formatCurrency } from "@/lib/utils";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes_constants";
import { Card, CardTitle } from "@/components/card";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { CumulativeNetPnLWidget } from "@/features/dashboard/widget/cumulative_pnl_widget";

export const Dashboard = () => {
    const {
        data: dashboardData,
        isLoading,
        isError,
    } = apiHooks.dashboard.useGet();

    const cumulativePnLData = useMemo(() => {
        if (!dashboardData) return [];

        return dashboardData.data.cumulative_pnl.map((d) => ({
            ...d,
            pnl: parseFloat(d.pnl),
        }));
    }, [dashboardData?.data.cumulative_pnl]);

    if (isError) {
        return (
            <p className="text-foreground-red">Error loading dashboard data.</p>
        );
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!dashboardData) return null;

    const grossPnL = dashboardData.data.gross_pnl;
    const netPnL = dashboardData.data.net_pnl;
    const winRate = dashboardData.data.win_rate_percentage;

    if (!!grossPnL && !!netPnL && !winRate) {
        return <WelcomeMessageForNewUser />;
    }

    return (
        <>
            <PageHeading heading="Dashboard" loading={isLoading} />
            <div>
                <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row">
                    <Card>
                        <CardTitle>Gross PnL</CardTitle>

                        <p
                            className={cn("big-heading", {
                                "text-foreground-green": Number(grossPnL) > 0,
                                "text-foreground-red": Number(grossPnL) < 0,
                            })}
                        >
                            {formatCurrency(dashboardData.data.gross_pnl)}
                        </p>
                    </Card>

                    <Card>
                        <CardTitle>Net PnL</CardTitle>
                        <p
                            className={cn("big-heading", {
                                "text-foreground-green": Number(netPnL) > 0,
                                "text-foreground-red": Number(netPnL) < 0,
                            })}
                        >
                            {formatCurrency(dashboardData.data.net_pnl)}
                        </p>
                    </Card>

                    <Card>
                        <CardTitle>Win Rate</CardTitle>
                        <p className="big-heading">{winRate}%</p>
                    </Card>
                </div>

                <div className="h-10" />

                <CumulativeNetPnLWidget data={cumulativePnLData} />
            </div>
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
        <div className="jusify-center mt-20 flex flex-col items-center">
            <div className="flex flex-col gap-y-4">
                <p>Hey {data?.display_name},</p>
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
