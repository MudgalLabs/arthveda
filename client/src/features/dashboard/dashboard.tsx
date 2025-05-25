import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { cn, formatCurrency } from "@/lib/utils";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";
import { Card, CardTitle } from "@/components/card";

export const Dashboard = () => {
    const { data, isLoading } = apiHooks.dashboard.useGet();

    const grossPnL = data?.data.gross_pnl || "";
    const netPnL = data?.data.net_pnl;
    const winRate = data?.data.win_rate_percentage;

    if (data) {
        if (!!grossPnL && !!netPnL && !winRate) {
            return (
                <div className="mt-10 text-center">
                    <p className="text-sm">
                        You have no{" "}
                        <Link to={ROUTES.positionList}>Positions</Link>
                    </p>
                    <div className="h-4" />
                    <p className="text-sm">
                        Start using Arthveda by{" "}
                        <Link to={ROUTES.addPosition}>adding</Link> a Position
                    </p>
                </div>
            );
        }

        return (
            <>
                <PageHeading heading="Dashboard" loading={isLoading} />

                <div className="flex gap-x-4">
                    <Card>
                        <CardTitle>Gross PnL</CardTitle>

                        <p
                            className={cn("big-heading", {
                                "text-foreground-green": Number(grossPnL) > 0,
                                "text-foreground-red": Number(grossPnL) < 0,
                            })}
                        >
                            {formatCurrency(data.data.gross_pnl)}
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
                            {formatCurrency(data.data.net_pnl)}
                        </p>
                    </Card>

                    <Card>
                        <CardTitle>Win Rate</CardTitle>
                        <p className="big-heading">{winRate}%</p>
                    </Card>
                </div>
            </>
        );
    }

    return null;
};

export default Dashboard;
