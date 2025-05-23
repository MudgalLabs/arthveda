import { Label } from "@/s8ly";

import { PageHeading } from "@/components/page_heading";
import { apiHooks } from "@/hooks/api_hooks";
import { cn, formatCurrency } from "@/lib/utils";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";

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
                <PageHeading heading="Dashboards" loading={isLoading} />

                <div className="[&_div]:border-border-muted [&_div]:bg-muted flex gap-x-8 [&_div]:rounded-md [&_div]:border-1 [&_div]:px-4 [&_div]:py-2">
                    <div>
                        <Label className="sub-heading">Gross PnL</Label>
                        <p
                            className={cn("big-heading", {
                                "text-foreground-green": Number(grossPnL) > 0,
                                "text-foreground-red": Number(grossPnL) < 0,
                            })}
                        >
                            {formatCurrency(data.data.gross_pnl)}
                        </p>
                    </div>

                    <div>
                        <Label className="sub-heading">Net PnL</Label>
                        <p
                            className={cn("big-heading", {
                                "text-foreground-green": Number(netPnL) > 0,
                                "text-foreground-red": Number(netPnL) < 0,
                            })}
                        >
                            {formatCurrency(data.data.net_pnl)}
                        </p>
                    </div>

                    <div>
                        <Label className="sub-heading">Win Rate</Label>
                        <p className="big-heading">{winRate}%</p>
                    </div>
                </div>
            </>
        );
    }

    return null;
};

export default Dashboard;
