import { useMemo } from "react";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes_constants";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { CumulativePnLCurve } from "@/features/dashboard/widget/cumulative_pnl_graph";
import { OverviewCard } from "@/features/dashboard/widget/overview_card";
import { WinningCard } from "./widget/winning_card";
import { LosingCard } from "./widget/loosing_card";

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
                <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row [&>div]:w-full">
                    <OverviewCard
                        gross_pnl_amount={data.gross_pnl}
                        net_pnl_amount={data.net_pnl}
                        total_charges_amount={data.charges}
                    />

                    <WinningCard
                        winRate={data.win_rate}
                        winRFactor={data.avg_win_r_factor}
                        maxWin={data.max_win}
                        avgWin={data.avg_win}
                        winStreak={data.win_streak}
                    />

                    <LosingCard
                        lossRate={data.loss_rate}
                        lossRFactor={data.avg_loss_r_factor}
                        maxLoss={data.max_loss}
                        avgLoss={data.avg_loss}
                        lossStreak={data.loss_streak}
                    />
                </div>

                <div className="h-10" />

                <CumulativePnLCurve data={cumulativePnLData} />
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
