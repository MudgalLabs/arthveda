import { memo, ReactNode } from "react";
import Decimal from "decimal.js";

import { Progress, Tooltip } from "@/s8ly";
import { IconTrendingDown, IconTrendingUp } from "@/components/icons";
import { CurrencyCode } from "@/features/position/position";
import { Card, CardContent, CardTitle } from "@/components/card";
import { cn, formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";

export const OverviewCard = memo(
    ({
        net_pnl_amount,
        gross_pnl_amount,
        total_charges_amount,
        charges_as_percentage_of_net_pnl,
        net_return_percentage = "",
        currency,
        className,
    }: {
        net_pnl_amount: DecimalString;
        gross_pnl_amount: DecimalString;
        total_charges_amount: DecimalString;
        charges_as_percentage_of_net_pnl?: DecimalString;
        net_return_percentage?: DecimalString;
        currency?: CurrencyCode;
        className?: string;
    }) => {
        let trendingIcon: ReactNode = null;
        let textColor = "text-foreground";
        const netPnL = new Decimal(net_pnl_amount);
        const grossPnL = new Decimal(gross_pnl_amount);
        const charges = new Decimal(total_charges_amount);
        const netReturnPercentage = new Decimal(net_return_percentage || "0");

        if (!netPnL.isZero() && netPnL.isPositive()) {
            trendingIcon = <IconTrendingUp size={20} />;
            textColor = "text-foreground-green";
        } else if (netPnL.isNegative()) {
            trendingIcon = <IconTrendingDown />;
            textColor = "text-foreground-red";
        }

        if (!charges_as_percentage_of_net_pnl) {
            charges_as_percentage_of_net_pnl = charges
                .div(grossPnL.isZero() ? 1 : grossPnL)
                .mul(100)
                .toFixed(2);
        }

        let progressValue =
            100 - new Decimal(charges_as_percentage_of_net_pnl).toNumber();

        if (grossPnL.isNegative()) {
            progressValue = 0;
        }

        return (
            <Card
                className={cn(
                    "flex h-full w-full min-w-72 flex-col gap-y-2",
                    className
                )}
            >
                <CardTitle>Overview</CardTitle>
                <CardContent className="flex h-full flex-col items-start">
                    <span className="label-muted">Net</span>
                    <div className={`flex items-end gap-x-2 ${textColor}`}>
                        <p className="heading leading-none">
                            {formatCurrency(net_pnl_amount, { currency })}
                        </p>
                        {net_return_percentage && (
                            <p>{netReturnPercentage.toFixed(2).toString()}%</p>
                        )}
                        <p>{trendingIcon}</p>
                    </div>

                    <div className="w-full">
                        <div className="h-4" />
                        <Tooltip
                            content={
                                <p className="text-sm font-normal">
                                    Charges are{" "}
                                    <span className="text-foreground-red font-semibold">
                                        {charges_as_percentage_of_net_pnl}%
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

                        <div className="h-2" />

                        <div className="flex w-full justify-between gap-x-4">
                            <div>
                                <span className="label-muted">Gross</span>
                                <p className="paragraph">
                                    <span
                                        className={cn("font-semibold", {
                                            "text-foreground-green":
                                                grossPnL.isPositive(),
                                            "text-foreground-red":
                                                grossPnL.isNegative(),
                                        })}
                                    >
                                        {formatCurrency(gross_pnl_amount, {
                                            currency,
                                        })}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <span className="label-muted">Charges</span>
                                <p className="paragraph">
                                    <span className="text-foreground-red font-semibold">
                                        {formatCurrency(total_charges_amount, {
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
