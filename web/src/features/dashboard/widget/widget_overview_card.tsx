import { memo, ReactNode } from "react";
import Decimal from "decimal.js";

import { Progress, Tooltip } from "netra";
import { IconTrendingDown, IconTrendingUp } from "@/components/icons";
import { CurrencyCode } from "@/features/position/position";
import { Card, CardContent, CardTitle } from "@/components/card";
import { cn, formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";

interface Props {
    net_pnl_amount: DecimalString;
    gross_pnl_amount: DecimalString;
    total_charges_amount: DecimalString;
    r_factor: DecimalString;
    charges_as_percentage_of_net_pnl?: DecimalString;
    net_return_percentage?: DecimalString;
    currency?: CurrencyCode;
    className?: string;
}

export const OverviewCard = memo(
    ({
        net_pnl_amount,
        gross_pnl_amount,
        total_charges_amount,
        r_factor,
        charges_as_percentage_of_net_pnl,
        net_return_percentage,
        currency,
        className,
    }: Props) => {
        let trendingIcon: ReactNode = null;
        let netPnLColor = "text-foreground";
        const netPnL = new Decimal(net_pnl_amount || "0");
        const grossPnL = new Decimal(gross_pnl_amount || "0");
        const charges = new Decimal(total_charges_amount || "0");
        const netReturnPercentage = new Decimal(net_return_percentage || "0");
        const rFactor = new Decimal(r_factor || "0");

        if (!netPnL.isZero() && netPnL.isPositive()) {
            trendingIcon = <IconTrendingUp size={20} />;
            netPnLColor = "text-text-success";
        } else if (netPnL.isNegative()) {
            trendingIcon = <IconTrendingDown />;
            netPnLColor = "text-text-destructive";
        }

        let chargesAsPercentageOfNetPnL = new Decimal(charges_as_percentage_of_net_pnl || "0");

        if (chargesAsPercentageOfNetPnL.isZero()) {
            chargesAsPercentageOfNetPnL = charges.div(grossPnL.isZero() ? 1 : grossPnL).mul(100);
        }

        let progressValue = 100 - chargesAsPercentageOfNetPnL.toNumber();

        if (grossPnL.isNegative()) {
            progressValue = 0;
        }

        return (
            <Card className={cn("flex h-full w-full flex-col gap-y-2", className)}>
                <CardTitle>Overview</CardTitle>

                <CardContent className="flex-y h-full flex-col justify-between">
                    <div className="flex w-full justify-between gap-x-4">
                        <div>
                            <span className="label-muted">Net</span>
                            <div className={`flex items-end gap-x-2 ${netPnLColor}`}>
                                <p className={`heading leading-none ${netPnLColor}`}>
                                    {formatCurrency(netPnL.toFixed(2).toString(), { currency })}
                                </p>
                                {net_return_percentage && <p>{netReturnPercentage.toFixed(2).toString()}%</p>}
                                <p>{trendingIcon}</p>
                            </div>
                        </div>

                        <div>
                            <span className="label-muted">R Factor</span>
                            <div className={`flex items-end gap-x-2`}>
                                <p className="sub-heading leading-none">{rFactor.toFixed(2).toString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <Tooltip
                            content={
                                <p>
                                    Charges are{" "}
                                    <span className="text-text-destructive font-medium">
                                        {chargesAsPercentageOfNetPnL.toFixed(2).toString()}%
                                    </span>{" "}
                                    of gross
                                </p>
                            }
                            contentProps={{
                                side: "right",
                            }}
                        >
                            <Progress value={progressValue} />
                        </Tooltip>
                    </div>

                    <div className="w-full">
                        <div className="flex w-full justify-between">
                            <div>
                                <span className="label-muted">Gross</span>
                                <p className="text-foreground text-base">
                                    <span
                                        className={cn("font-semibold", {
                                            // "text-text-destructive": grossPnL.isPositive(),
                                            // "text-text-success": grossPnL.isNegative(),
                                        })}
                                    >
                                        {formatCurrency(grossPnL.toFixed(2).toString(), {
                                            currency,
                                        })}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <span className="label-muted">Charges</span>
                                <p className="text-foreground text-base">
                                    <span className="font-semibold">
                                        {formatCurrency(charges.toFixed(2).toString(), {
                                            currency,
                                        })}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
);
