import { getUserTimezone } from "netra";

import { Card } from "@/components/card";
import { IconBadgeCheck } from "@/components/icons";
import { UpgradeToPro } from "@/features/settings/plan_and_billing/components/upgrade_to_pro";
import { useUserHasProSubscription } from "@/features/auth/auth_context";
import { cn, formatCurrency } from "@/lib/utils";
import { PADDLE_PRICE_ID } from "@/constants";
import { BrokerAccountInfoTooltip } from "@/features/broker/components/broker_account_info_tooltip";

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
    console.log("User timezone:", tz);
    const isIndia = tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
    const yearlyPrice = isIndia ? 1500 : 50;
    const currency = isIndia ? "inr" : "usd";

    const hasPro = useUserHasProSubscription();

    return (
        <div className="text-text-primary mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <Card className="flex flex-col justify-between">
                <div className="space-y-2">
                    {hasPro && <p className="label-muted absolute right-4">Current plan</p>}

                    <h3 className="heading mb-1">Subscribe to Arthveda</h3>

                    <p className="text-muted-foreground mx-auto text-sm">
                        14-day 100% money-back guarantee. No questions asked.
                    </p>

                    <p className="text-text-primary mt-8 text-center text-4xl font-bold">
                        {formatCurrency(yearlyPrice, {
                            currency,
                        })}
                        <span className="text-muted-foreground text-base font-medium">/year</span>
                    </p>
                </div>

                <UpgradeToPro
                    className="mt-8 w-full px-4 py-2"
                    priceId={PADDLE_PRICE_ID}
                    onClick={closePricingDialog}
                />
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
