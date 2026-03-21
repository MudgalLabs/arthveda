import { memo } from "react";
import Decimal from "decimal.js";

import { Progress, Tooltip } from "netra";
import { CurrencyCode } from "@/features/position/position";
import { Card, CardContent, CardTitle } from "@/components/card";
import { cn, formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";
import { PnL } from "@/components/pnl";

interface Props {
    net_pnl_amount: DecimalString;
    gross_pnl_amount: DecimalString;
    total_charges_amount: DecimalString;
    r_factor: DecimalString;
    gross_r_factor?: DecimalString;
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
        // r_factor,
        gross_r_factor,
        charges_as_percentage_of_net_pnl,
        net_return_percentage,
        currency,
        className,
    }: Props) => {
        let grossPnLColor = "text-foreground";
        const netPnL = new Decimal(net_pnl_amount || "0");
        const grossPnL = new Decimal(gross_pnl_amount || "0");
        const charges = new Decimal(total_charges_amount || "0");
        const netReturnPercentage = new Decimal(net_return_percentage || "0");
        // const netRFactor = new Decimal(r_factor || "0");
        const grossRFactor = new Decimal(gross_r_factor || "0");

        if (!grossPnL.isZero() && grossPnL.isPositive()) {
            grossPnLColor = "text-success-foreground-2";
        } else if (netPnL.isNegative()) {
            grossPnLColor = "text-text-destructive-2";
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
                <CardTitle className="section-heading-muted!">Overview</CardTitle>

                <CardContent className="flex-y h-full flex-col justify-between gap-y-2">
                    <div className="flex w-full justify-between gap-x-4">
                        <div>
                            <span className="section-heading-muted text-xs">Net PnL</span>
                            <div className={`flex items-end gap-x-2 ${grossPnLColor}`}>
                                <PnL className={`heading leading-none ${grossPnLColor}`} value={netPnL}>
                                    {formatCurrency(netPnL.toFixed(2).toString(), { currency })}
                                </PnL>

                                {net_return_percentage && (
                                    <PnL value={netReturnPercentage}>
                                        <p className="font-semibold">{netReturnPercentage.toFixed(2).toString()}%</p>
                                    </PnL>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="section-heading-muted text-xs">Gross R</span>

                            <div className="sub-heading flex items-end gap-x-2 leading-none">
                                <PnL value={grossRFactor}>{grossRFactor.toFixed(2).toString()}</PnL>
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
                                <span className="section-heading-muted text-xs">Gross PnL</span>
                                <div className="flex-x">
                                    <span className="font-semibold">
                                        {formatCurrency(grossPnL.toFixed(2).toString(), {
                                            currency,
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="section-heading-muted text-xs">Charges</span>
                                <p className="text-sm">
                                    <span className="font-semibold">
                                        {formatCurrency(charges.mul(-1).toFixed(2).toString(), {
                                            currency,
                                        })}
                                    </span>
                                </p>
                            </div>

                            {/* <div>
                                <span className="section-heading-muted text-xs">Gross R</span>
                                <p className="text-foreground text-base">
                                    <PnL className={cn("font-semibold", {})} value={grossRFactor}>
                                        {grossRFactor.toFixed(2).toString()}
                                    </PnL>
                                </p>
                            </div> */}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
);
