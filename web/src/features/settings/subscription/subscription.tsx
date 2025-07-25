import { useEffect, useState } from "react";
import { Loading } from "@/components/loading";
import { PageHeading } from "@/components/page_heading";
import { toast } from "@/components/toast";
import { UpgradeToPro } from "@/components/upgrade_to_pro";
import { useSubscription, useUserHasProSubscription } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { Button } from "@/s8ly";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { DataTable } from "@/s8ly/data_table/data_table";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { BillingIntervalToString, PaymentProviderToString, SubscriptionInvoice } from "@/lib/api/subscription";
import { useURLState } from "@/hooks/use_url_state";
import { useEffectOnce } from "@/hooks/use_effect_once";

export const Subscription = () => {
    const subscription = useSubscription();
    const hasPro = useUserHasProSubscription();

    const {
        data: invoices,
        isLoading: invoicesLoading,
        error: invoicesError,
        isFetching: invoicesFetching,
    } = apiHooks.subscription.useUserSubscriptionInvoices();

    const { mutate: cancelSubscription } = apiHooks.subscription.useCancelSubscriptionAtPeriodEnd({
        onSuccess: () => {
            toast.success("Subscription scheduled to cancel", {
                description: "Your subscription will be cancelled at the end of the current period.",
            });
        },
        onError: apiErrorHandler,
    });

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
        },
        {
            accessorKey: "plan_id",
            header: ({ column }) => <DataTableColumnHeader title="Plan" column={column} />,
            cell: ({ row }) => (row.original.plan_id === "pro" ? "Pro" : "Unknown"),
        },
        {
            accessorKey: "billing_interval",
            header: ({ column }) => <DataTableColumnHeader title="Interval" column={column} />,
            cell: ({ row }) => BillingIntervalToString(row.original.billing_interval),
        },
        {
            accessorKey: "provider",
            header: ({ column }) => <DataTableColumnHeader title="Provider" column={column} />,
            cell: ({ row }) => PaymentProviderToString(row.original.provider),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const [fetch, setFetch] = useState(false);
                const { data } = apiHooks.subscription.useUserSubscriptionInvoiceDownloadLink(row.original.id, {
                    enabled: fetch,
                });

                useEffect(() => {
                    if (fetch && data) {
                        window.open(data, "_blank");
                    }
                }, [fetch, data]);

                return (
                    <Button variant="ghost" onClick={() => setFetch(true)}>
                        Download Invoice
                    </Button>
                );
            },
        },
    ];

    const [isPaddleSuccess] = useURLState<boolean | "">("paddle_success", false);
    useEffectOnce(
        (deps) => {
            if (deps.isPaddleSuccess) {
                toast.success("Upgraded to Pro successfully!", {
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

    return (
        <div>
            <PageHeading heading="Subscription" />

            <div className="sub-heading text-text-muted">Current plan: {hasPro ? "Pro" : "Free"}</div>

            <div className="mt-4 flex justify-between">
                {hasPro ? (
                    <>
                        {subscription?.cancel_at_period_end ? (
                            <div className="text-text-muted">
                                Your subscription will be cancelled at the end of the current period.
                            </div>
                        ) : (
                            <Button variant="destructive" onClick={() => cancelSubscription()}>
                                Cancel
                            </Button>
                        )}
                    </>
                ) : (
                    <UpgradeToPro />
                )}
            </div>

            <div className="mt-8">
                <h2 className="mb-2 text-lg font-semibold">Past invoices</h2>
                {invoicesLoading ? (
                    <Loading />
                ) : invoicesError ? (
                    <div className="text-text-destructive">Failed to load invoices</div>
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
            </div>
        </div>
    );
};

export default Subscription;
