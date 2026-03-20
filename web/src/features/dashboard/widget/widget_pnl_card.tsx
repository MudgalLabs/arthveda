import { Card, CardContent, CardTitle, Tooltip } from "netra";
import Decimal from "decimal.js";

import { formatCurrency } from "@/lib/utils";
import { PnL } from "@/components/pnl";
import { Progress } from "@/s8ly";
import { EfficiencyInfoTooltip } from "@/components/efficiency_info_tooltip";

interface WidgetPnLCardProps {
    gross: Decimal;
    net: Decimal;
    charges: Decimal;
}

export function WidgetPnLCard(props: WidgetPnLCardProps) {
    const { gross, net, charges } = props;

    let progressValue = 0;

    if (gross.gt(0)) {
        const efficiency = net.div(gross).mul(100).toNumber();
        progressValue = Math.max(0, Math.min(100, efficiency));
    }

    return (
        <Card className="h-full w-full">
            <CardTitle className="section-heading-muted!">Net PnL</CardTitle>

            <CardContent className="flex h-full flex-col items-center justify-center gap-4">
                <span className="big-heading absolute-center leading-0">
                    <PnL value={net}>{formatCurrency(net.toFixed(2))}</PnL>
                </span>

                <div className="absolute bottom-4 w-full px-4">
                    <span className="text-muted-foreground flex-x mb-1 justify-end">
                        {progressValue.toFixed(0)}% Eff.
                        <EfficiencyInfoTooltip />
                    </span>

                    <Tooltip
                        content={
                            <div className="flex min-w-[220px] flex-col gap-2">
                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                    <span>Gross</span>
                                    <PnL value={gross}>{formatCurrency(gross.toFixed(2))}</PnL>
                                </div>

                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                    <span>Charges</span>
                                    <PnL value={charges}>{formatCurrency(charges.toFixed(2))}</PnL>
                                </div>
                            </div>
                        }
                        contentProps={{
                            side: "bottom",
                        }}
                    >
                        <Progress value={progressValue} />
                    </Tooltip>
                </div>
            </CardContent>
        </Card>
    );
}
