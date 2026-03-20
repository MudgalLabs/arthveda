import Decimal from "decimal.js";
import { Card, CardContent, CardTitle } from "netra";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/s8ly";
import { PnL } from "@/components/pnl";

interface WidgetAvgWinLossProps {
    avgWin: Decimal;
    avgLoss: Decimal;
    ratio: Decimal;
}

export function WidgetAvgWinLoss(props: WidgetAvgWinLossProps) {
    const { avgWin, avgLoss, ratio } = props;

    const avgLossAbs = avgLoss.abs();
    const total = avgWin.add(avgLossAbs);

    const progressValue = total.gt(0) ? avgWin.div(total).mul(100).toNumber() : 0;

    return (
        <Card className="h-full w-full">
            <CardTitle className="section-heading-muted!">Avg Win / Loss</CardTitle>

            <CardContent className="flex h-full flex-col items-center justify-center gap-4">
                <span className="big-heading absolute-center leading-0">{ratio.toFixed(2)}</span>

                <div className="absolute bottom-4 w-full px-4">
                    <div className="flex-x mb-2 justify-between">
                        <PnL value={avgWin}>
                            <span className="font-medium tabular-nums">{formatCurrency(avgWin.toFixed(2))}</span>
                        </PnL>
                        <PnL value={avgLoss}>
                            <span className="font-medium tabular-nums">{formatCurrency(avgLoss.toFixed(2))}</span>
                        </PnL>
                    </div>

                    <Progress value={progressValue} />
                </div>
            </CardContent>
        </Card>
    );
}
