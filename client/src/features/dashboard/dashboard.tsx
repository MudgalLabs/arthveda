import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { cn, formatCurrency } from "@/lib/utils";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";
import { Card, CardTitle } from "@/components/card";
import { useAuthentication } from "../auth/auth_context";
import { useMemo } from "react";

export const Dashboard = () => {
    const { data: authData } = useAuthentication();
    const { data: dashboardData, isLoading } = apiHooks.dashboard.useGet();

    const content = useMemo(() => {
        if (!authData || !dashboardData || isLoading) {
            return null;
        }

        const grossPnL = dashboardData?.data.gross_pnl || "";
        const netPnL = dashboardData?.data.net_pnl;
        const winRate = dashboardData?.data.win_rate_percentage;

        if (!!grossPnL && !!netPnL && !winRate) {
            return (
                <div className="jusify-center mt-20 flex flex-col items-center">
                    <div className="flex flex-col gap-y-4">
                        <p>Hey {authData?.display_name},</p>
                        <p>
                            Looks like you are new here and have no{" "}
                            <Link
                                className="text-base!"
                                to={ROUTES.positionList}
                            >
                                positions
                            </Link>{" "}
                            added yet.
                        </p>
                        <p>
                            Start using Arthveda by{" "}
                            <Link
                                className="text-base!"
                                to={ROUTES.addPosition}
                            >
                                adding
                            </Link>{" "}
                            a position or
                            <Link
                                className="text-base!"
                                to={ROUTES.importPositions}
                            >
                                {" "}
                                importing
                            </Link>{" "}
                            positions from your broker.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex gap-x-4">
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
        );
    }, [authData, dashboardData, isLoading]);

    return (
        <>
            <PageHeading
                heading="Dashboard"
                loading={isLoading || !dashboardData || !authData}
            />
            {content}
        </>
    );
};

export default Dashboard;
