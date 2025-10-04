import { Card } from "@/components/card";
import { IconBadgeCheck } from "@/components/icons";
import { UpgradeToPro } from "@/features/settings/plan_and_billing/components/upgrade_to_pro";
import { useUserHasProSubscription } from "@/features/auth/auth_context";
import { cn } from "@/lib/utils";
import { Button, IconInfo, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Tooltip } from "netra";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { PADDLE_PRICE_ID_MONTHLY, PADDLE_PRICE_ID_YEARLY } from "@/constants";
import { BrokerAccountInfoTooltip } from "@/features/broker/components/broker_account_info_tooltip";

interface PricingProps {
    closePricingDialog?: () => void;
}

export function Pricing(props: PricingProps) {
    const { closePricingDialog } = props;

    const [yearly, setYearly] = useState(true);
    const monthlyPrice = 199;
    const yearlyPricePerMonth = 99;

    const posthog = usePostHog();
    const hasPro = useUserHasProSubscription();

    return (
        <div className="text-text-primary mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
                <h1 className="mx-auto justify-center gap-x-2 gap-y-1 text-center text-3xl leading-tight font-medium sm:text-5xl md:gap-x-3.5 md:gap-y-2 md:text-7xl lg:font-semibold">
                    Two plans, <span className="text-accent inline!">one purpose</span>
                </h1>

                <div className="bg-muted relative mx-auto mt-6 inline-flex w-fit items-center justify-center rounded-md p-1">
                    <button
                        onClick={() => setYearly(true)}
                        className={cn(
                            "rounded-md px-4 py-1 text-sm font-medium transition",
                            yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}
                    >
                        Yearly
                    </button>
                    <button
                        onClick={() => setYearly(false)}
                        className={cn(
                            "rounded-md px-4 py-1 text-sm font-medium transition",
                            !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}
                    >
                        Monthly
                    </button>
                </div>

                <div className="flex-center mt-2 gap-x-1">
                    <Tag variant="success" size="small">
                        50% off
                    </Tag>
                    <span className="text-muted-foreground text-xs">on yearly billing</span>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="relative flex h-60 flex-col justify-between">
                    <div>
                        {!hasPro && <p className="label-muted absolute right-4">Current plan</p>}
                        <h3 className="heading mb-1">Free</h3>
                        <p className="text-muted-foreground mb-2 text-sm">
                            Ideal for hobbyists, beginners & curious minds.
                        </p>
                        <p className="text-text-primary absolute-center text-4xl font-bold">
                            ₹0
                            <span className="text-muted-foreground text-base font-medium">/month</span>
                        </p>
                    </div>
                    <a onClick={() => posthog.capture("free_plan_clicked_on_pricing_page")}>
                        <Button className="mt-4 w-full px-4 py-2" variant="secondary" onClick={closePricingDialog}>
                            Free forever
                        </Button>
                    </a>
                </Card>

                <Card className="relative flex h-60 flex-col justify-between">
                    <div>
                        {hasPro && <p className="label-muted absolute right-4">Current plan</p>}
                        <h3 className="heading mb-1">Pro</h3>
                        <p className="text-muted-foreground mx-auto text-sm">
                            Ideal for active traders who are performance-driven.
                        </p>
                        <p className="text-text-primary absolute-center text-4xl font-bold">
                            ₹{yearly ? yearlyPricePerMonth : monthlyPrice}
                            <span className="text-muted-foreground text-base font-medium">/month</span>
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground text-xs">
                            {yearly ? `Billed yearly as ₹${yearlyPricePerMonth * 12}` : "Billed monthly"}. No refund
                            once paid. Read our <a className="cursor-pointer! text-xs!">refund policy</a>.
                        </p>
                        <UpgradeToPro
                            className="mt-4 w-full px-4 py-2"
                            priceId={yearly ? PADDLE_PRICE_ID_YEARLY : PADDLE_PRICE_ID_MONTHLY}
                            onClick={closePricingDialog}
                        />
                    </div>
                </Card>
            </div>

            <p className="text-muted-foreground mb-6 text-sm font-medium text-pretty!">
                💡 <span className="text-foreground font-semibold">Subscribe yearly</span> and lock in this price for a
                year. As Arthveda grows, prices may increase, but yours won’t.
            </p>

            <div className="h-8" />

            <div className="overflow-x-auto">
                <Table className="min-w-full border-collapse overflow-hidden rounded-md text-sm">
                    <TableHeader>
                        <TableRow className="bg-muted text-left">
                            <TableHead className="px-6 py-4 text-base font-semibold">Feature</TableHead>
                            <TableHead className="px-6 py-4 text-base font-semibold">Free</TableHead>
                            <TableHead className="px-6 py-4 text-base font-semibold">
                                <div className="flex-x items-baseline">
                                    Pro
                                    <p className="text-xs font-normal">(everything in Free)</p>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-muted/20 divide-y">
                        <TableRow>
                            <TableCell className="px-6 py-3">Trade imports</TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" /> Unlimited
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" /> Unlimited
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/5">
                            <TableCell className="px-6 py-3">
                                {" "}
                                <div className="flex-x">
                                    Data and insights
                                    <Tooltip
                                        content="Includes Dashboard, Positions and Calendar."
                                        contentProps={{ className: "max-w-xs" }}
                                    >
                                        <IconInfo size={14} />
                                    </Tooltip>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-accent" />
                                    Past 1 year only
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" />
                                    Full history
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/5">
                            <TableCell className="px-6 py-3">Broker integrations</TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" />
                                    File import and daily sync
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" />
                                    File import and daily sync
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    Broker accounts <BrokerAccountInfoTooltip />
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-accent" />1 account
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" />
                                    10 accounts
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/5">
                            <TableCell className="px-6 py-3">Support</TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-accent" />
                                    Normal
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                                <div className="flex-x">
                                    <IconBadgeCheck className="text-text-success" />
                                    Priority
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <p className="text-muted-foreground mt-4 text-xs italic">
                    Unlimited = subject to fair usage. Abusive usage or bot imports may be throttled.
                </p>
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
