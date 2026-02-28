import { getUserTimezone } from "netra";

import { Card } from "@/components/card";
import { IconBadgeCheck } from "@/components/icons";
import { UpgradeToPro } from "@/features/settings/plan_and_billing/components/upgrade_to_pro";
import { useUserHasProSubscription, useUserIsOnTrial } from "@/features/auth/auth_context";
import { cn, formatCurrency } from "@/lib/utils";
import { PADDLE_PRICE_ID_YEARLY, PADDLE_PRICE_ID_MONTHLY } from "@/constants";
import { BrokerAccountInfoTooltip } from "@/features/broker/components/broker_account_info_tooltip";
import { BillingInterval } from "@/lib/api/subscription";
import { useState } from "react";

const FEATURES = [
    "Journal unlimited positions via import or manual entry",
    "Analytics and insights",
    <p className="flex-x">
        Import and sync from upto 10 broker accounts <BrokerAccountInfoTooltip />
    </p>,
    "Priority customer support",
    "Access to all new features as we launch them",
];

interface PricingProps {
    closePricingDialog?: () => void;
}

export function Pricing(props: PricingProps) {
    const { closePricingDialog } = props;

    const tz = getUserTimezone();
    const isIndia = tz === "Asia/Kolkata" || tz === "Asia/Calcutta";

    const currency = isIndia ? "INR" : "USD";
    const monthlyPrice = isIndia ? 399 : 9;
    const yearlyPrice = isIndia ? 1999 : 69;

    const discountPercentage = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

    const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

    const activeInterval = billingInterval === "monthly" ? "month" : "year";
    const activePrice = billingInterval === "monthly" ? monthlyPrice : yearlyPrice;
    const activePriceId = billingInterval === "monthly" ? PADDLE_PRICE_ID_MONTHLY : PADDLE_PRICE_ID_YEARLY;

    const hasPro = useUserHasProSubscription();
    const onTrial = useUserIsOnTrial();

    return (
        <div className="text-text-primary mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />

            <div className="h-2" />

            <p className="text-text-muted text-center">
                <span className="text-text-success text-lg font-semibold">Save {discountPercentage}%</span> on yearly
                subscription!
            </p>

            <div className="h-6" />

            <Card className="flex flex-col justify-between">
                <div className="space-y-2">
                    {hasPro && !onTrial && <p className="label-muted absolute right-4">Current plan</p>}

                    <h3 className="heading mb-1">Subscribe to Arthveda</h3>

                    <p className="text-muted-foreground mx-auto text-sm">
                        14-day 100% money-back guarantee. No questions asked.
                    </p>

                    <p className="text-text-primary mt-8 text-center text-4xl font-bold">
                        {formatCurrency(activePrice, {
                            currency,
                        })}
                        <span className="text-muted-foreground text-base font-medium">/{activeInterval}</span>
                    </p>

                    <p className="text-text-muted text-center text-xs">
                        (exclusive of {isIndia ? "GST" : "VAT if applicable"})
                    </p>
                </div>

                <UpgradeToPro className="mt-8 w-full px-4 py-2" priceId={activePriceId} onClick={closePricingDialog} />
            </Card>

            <p className="text-muted-foreground mt-2 text-xs">
                Read our{" "}
                <a
                    className="cursor-pointer! text-xs!"
                    href="https://arthveda.app/refund"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    refund policy
                </a>
                .
            </p>

            <div className="h-8" />

            <div>
                {FEATURES.map((feature, index) => (
                    <div key={index} className={cn("mb-2 flex items-center text-sm", index === 0 && "mt-0")}>
                        <IconBadgeCheck className="text-text-success mr-2" />
                        {feature}
                    </div>
                ))}
            </div>

            <div className="h-4" />

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                    <span className="font-medium text-white">Arthveda is growing every month.</span>{" "}
                    <a href="https://arthveda.app/roadmap" target="_blank" rel="noopener noreferrer">
                        See what’s coming →
                    </a>
                </p>
            </div>
        </div>
    );
}

interface BillingIntervalToggleProps {
    value: BillingInterval;
    onChange: (value: BillingInterval) => void;
}

export function BillingIntervalToggle({ value, onChange }: BillingIntervalToggleProps) {
    return (
        <div className="flex items-center justify-center">
            <div className="bg-muted relative flex rounded-full p-1">
                <div
                    className={cn(
                        "bg-primary absolute top-1 bottom-1 w-1/2 rounded-full shadow-sm transition-all duration-200",
                        value === "monthly" ? "left-1" : "left-1/2"
                    )}
                />

                <button
                    onClick={() => onChange("monthly")}
                    className={cn(
                        "relative z-10 w-28 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        value === "monthly" ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    Monthly
                </button>

                <button
                    onClick={() => onChange("yearly")}
                    className={cn(
                        "relative z-10 flex w-28 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        value === "yearly" ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    Yearly
                </button>
            </div>
        </div>
    );
}
