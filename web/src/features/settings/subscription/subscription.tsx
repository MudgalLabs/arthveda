import { useEffect, useState } from "react";
import { Loading } from "@/components/loading";
import { PageHeading } from "@/components/page_heading";
import { toast } from "@/components/toast";
import { useSubscription, useUserHasProSubscription } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { Button, Dialog, DialogContent, DialogTrigger, Tooltip } from "@/s8ly";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { BillingIntervalToString, PaymentProviderToString, SubscriptionInvoice } from "@/lib/api/subscription";
import { useURLState } from "@/hooks/use_url_state";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { Pricing } from "./components/pricing";
import { IconDownload } from "@/components/icons";
import { Card, CardContent, CardTitle } from "@/components/card";
import { CancelAutoRenew } from "./components/cancel_auto_renew";

export const Subscription = () => {
    const subscription = useSubscription();
    const hasPro = useUserHasProSubscription();

    const [isPaddleSuccess] = useURLState<boolean | "">("paddle_success", false);
    useEffectOnce(
        (deps) => {
            if (deps.isPaddleSuccess) {
                toast.success("Upgraded to Pro!", {
                    description: (
                        <>
                            <p>Thank you for supporting Arthveda.</p>
                            <p>Refresh if you don't see the changes.</p>
                        </>
                    ),
                    duration: 10000,
                });
                // remove the URL state to prevent re-triggering the toast
                window.history.replaceState({}, "", window.location.pathname);
            }
        },
        { isPaddleSuccess },
        (deps) => !!deps.isPaddleSuccess
    );

    if (!subscription) {
        return null;
    }

    return (
        <div>
            <PageHeading heading="Subscription" />

            <Card>
                <CardTitle className="flex-x justify-between">
                    <p className="text-text-muted! heading!">{hasPro ? "Pro" : "Free forever"}</p>
                    <div>{hasPro && !subscription.cancel_at_period_end ? <CancelAutoRenew /> : <ShowPricing />}</div>
                </CardTitle>

                <CardContent className="mt-2">
                    {hasPro ? (
                        <div className="space-y-2">
                            {subscription.cancel_at_period_end ? (
                                <p className="text-text-primary">
                                    Your subscription is set to cancel and will end on{" "}
                                    {formatDate(new Date(subscription.valid_until))}.
                                </p>
                            ) : (
                                <>
                                    <p className="text-text-primary">
                                        Your subscription is active. You can cancel it at any time.
                                    </p>
                                    <p>Renewing on {formatDate(new Date(subscription.valid_until))}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-text-muted">
                            You are currently on the free plan.{" "}
                            <span className="text-text-primary font-medium">Click on Upgrade</span> to learm more and
                            upgrade to Pro.
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="my-8">
                <PastInvoices />
            </div>
        </div>
    );
};

export default Subscription;

function ShowPricing() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Dialog modal={false} open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Upgrade</Button>
            </DialogTrigger>
            <DialogContent className="max-h-screen! max-w-screen! overflow-y-auto">
                <Pricing closePricingDialog={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function PastInvoices() {
    const {
        data: invoicesData,
        isLoading: invoicesLoading,
        error: invoicesError,
        isFetching: invoicesFetching,
    } = apiHooks.subscription.useUserSubscriptionInvoices();

    const invoices = invoicesData ?? [];

    const columns: ColumnDef<SubscriptionInvoice>[] = [
        {
            accessorKey: "paid_at",
            header: ({ column }) => <DataTableColumnHeader title="Paid At" column={column} />,
            cell: ({ row }) => formatDate(new Date(row.original.paid_at), { time: true }),
        },
        {
            accessorKey: "amount_paid",
            header: ({ column }) => <DataTableColumnHeader title="Amount Paid" column={column} />,
            cell: ({ row }) => `${formatCurrency(row.original.amount_paid, { currency: row.original.currency })}`,
            enableSorting: false,
        },
        {
            accessorKey: "plan_id",
            header: ({ column }) => <DataTableColumnHeader title="Plan" column={column} />,
            cell: ({ row }) => (row.original.plan_id === "pro" ? "Pro" : "Unknown"),
            enableSorting: false,
        },
        {
            accessorKey: "billing_interval",
            header: ({ column }) => <DataTableColumnHeader title="Interval" column={column} />,
            cell: ({ row }) => BillingIntervalToString(row.original.billing_interval),
            enableSorting: false,
        },
        {
            accessorKey: "provider",
            header: ({ column }) => <DataTableColumnHeader title="Provider" column={column} />,
            cell: ({ row }) => PaymentProviderToString(row.original.provider),
            enableSorting: false,
        },
        {
            id: "actions",
            header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
            cell: ({ row }) => {
                const [fetch, setFetch] = useState(false);
                const { data } = apiHooks.subscription.useUserSubscriptionInvoiceDownloadLink(row.original.id, {
                    enabled: fetch,
                });

                useEffect(() => {
                    if (fetch && data) {
                        window.open(data, "_blank");
                        setFetch(false); // So that user can click again to download the invoice.
                    }
                }, [fetch, data]);

                return (
                    <Tooltip content="Download Invoice" contentProps={{ side: "left" }}>
                        <Button variant="ghost" size="icon" onClick={() => setFetch(true)}>
                            <IconDownload size={18} />
                        </Button>
                    </Tooltip>
                );
            },
            enableSorting: false,
        },
    ];

    if (invoicesError) {
        return <div className="text-text-destructive">Failed to load invoices</div>;
    }

    if (invoicesLoading) {
        return <Loading />;
    }

    return (
        <>
            <h2 className="sub-heading">Invoices</h2>

            <div className="h-4" />

            {invoices.length === 0 ? (
                <div className="flex-center paragraph">No invoices yet</div>
            ) : (
                <DataTableSmart
                    columns={columns}
                    data={invoices ?? []}
                    total={(invoices ?? []).length}
                    isFetching={invoicesFetching}
                >
                    {(table) => (
                        <>
                            <DataTable table={table} />
                        </>
                    )}
                </DataTableSmart>
            )}
        </>
    );
}
