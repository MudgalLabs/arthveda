import { useEffect, useState } from "react";
import { Loading } from "@/components/loading";
import { toast } from "@/components/toast";
import { useSubscription, useUserHasProSubscription } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import {
    Alert,
    Button,
    Dialog,
    DialogContent,
    DialogTrigger,
    IconCreditCard,
    IconInfo,
    Tooltip,
    useDocumentTitle,
    PageHeading,
} from "netra";
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
import { CancelSubscription } from "@/features/settings/plan_and_billing/components/cancel_subscription";

export const PlanAndBilling = () => {
    useDocumentTitle("Plan and billing • Arthveda");
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

    return (
        <div>
            <PageHeading>
                <IconCreditCard size={18} />

                <h1>Plan and billing</h1>
            </PageHeading>

            <Alert>
                <IconInfo />

                <div className="flex-x items-start justify-between">
                    <div className="w-full space-y-2">
                        <div className="w-full space-y-2 sm:flex sm:flex-row sm:justify-between">
                            <p className="font-semibold">You are currently on the {hasPro ? "Pro" : "Free"} plan.</p>

                            {hasPro && !subscription?.cancel_at_period_end ? <CancelSubscription /> : <ShowPricing />}
                        </div>

                        {hasPro ? (
                            <div className="text-text-muted space-y-2">
                                {subscription?.cancel_at_period_end ? (
                                    <p>
                                        Your subscription is set to cancel and will end on{" "}
                                        {formatDate(new Date(subscription.valid_until))}.
                                    </p>
                                ) : (
                                    <p>
                                        Renewing on {formatDate(new Date(subscription!.valid_until))}. You can cancel it
                                        at any time.
                                    </p>
                                )}
                                <p>
                                    Contact us at <a href="mailto:hey@arthveda.app">hey@arthveda.app</a> if you want to
                                    request a refund.
                                </p>
                            </div>
                        ) : (
                            <div className="text-text-muted">
                                <p>
                                    Click on <span className="font-semibold">Upgrade</span> to learn more about Pro.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Alert>

            <div className="my-8">
                <Invoices />
            </div>
        </div>
    );
};

export default PlanAndBilling;

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

function Invoices() {
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
