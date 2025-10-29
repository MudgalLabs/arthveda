import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";
import { CurrencyCode } from "@/lib/api/currency";

export type PlanID = "pro" | "trial";

export type SubscriptionStatus = "active" | "canceled" | "expired";

export type BillingInterval = "monthly" | "yearly" | "once";

export function BillingIntervalToString(interval: BillingInterval): string {
    switch (interval) {
        case "monthly":
            return "Monthly";
        case "yearly":
            return "Yearly";
        default:
    }

    return "Unknown";
}

export type PaymentProvider = "paddle" | "internal";

export function PaymentProviderToString(provider: PaymentProvider): string {
    switch (provider) {
        case "paddle":
            return "Paddle";
        default:
    }

    return "Unknown";
}

export interface Subscription {
    user_id: string;
    plan_id: PlanID;
    status: SubscriptionStatus;
    valid_from: string; // iso8601 date string
    valid_until: string; // iso8601 date string
    billing_interval: BillingInterval;
    provider: PaymentProvider;
    external_ref: string | null;
    cancel_at_period_end: boolean;
    created_at: string; // iso8601 date string
    updated_at: string; // iso8601 date string
}

export interface SubscriptionInvoice {
    id: string;
    user_id: string;
    provider: PaymentProvider;
    external_id: string;
    plan_id: PlanID;
    billing_interval: BillingInterval;
    amount_paid: string;
    currency: CurrencyCode;
    paid_at: string;
    metadata?: any;
    created_at: string;
}

export function cancelSubscriptionAtPeriodEnd() {
    return client.post(API_ROUTES.subscription.cancelSubscriptionAtPeriodEnd);
}

export async function fetchUserSubscriptionInvoices() {
    return client.get(API_ROUTES.subscription.listUserSubscriptionInvoices);
}

export async function fetchUserSubscriptionInvoiceDownloadLink(invoiceId: string) {
    return client.get(API_ROUTES.subscription.invoiceDownloadLink(invoiceId));
}
