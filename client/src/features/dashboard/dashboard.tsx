import { useMemo } from "react";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { formatCurrency } from "@/lib/utils";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes_constants";
import { Card, CardContent, CardTitle } from "@/components/card";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { CumulativeNetPnLWidget } from "@/features/dashboard/widget/cumulative_pnl_widget";
import { PnLCard } from "@/features/dashboard/widget/pnl_card";
import { toast } from "@/components/toast";

export const Dashboard = () => {
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
        <>
            <PageHeading heading="Dashboard" loading={isFetching} />
            <div>
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-4 [&>div]:w-full sm:[&>div]:w-fit">
                    <PnLCard
                        gross_pnl_amount={data.gross_pnl}
                        net_pnl_amount={data.net_pnl}
                        total_charges_amount={data.charges}
                    />

                    <Card>
                        <CardTitle>Win Rate</CardTitle>
                        <CardContent>{data.win_rate}%</CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Avg Win R</CardTitle>
                        <CardContent>{data.avg_win_r_factor}</CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Avg Loss R</CardTitle>
                        <CardContent>{data.avg_loss_r_factor}</CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Avg Win</CardTitle>
                        <CardContent>
                            {formatCurrency(data.avg_win)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Avg Loss</CardTitle>
                        <CardContent>
                            {formatCurrency(data.avg_loss)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Max Win</CardTitle>
                        <CardContent>
                            {formatCurrency(data.max_win)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Max Loss</CardTitle>
                        <CardContent>
                            {formatCurrency(data.max_loss)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Win Streak</CardTitle>
                        <CardContent>{data.win_streak}</CardContent>
                    </Card>

                    <Card>
                        <CardTitle>Loss Streak</CardTitle>
                        <CardContent>{data.loss_streak}</CardContent>
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
