export type PlanID = "pro";

export type SubscriptionStatus = "active" | "canceled" | "expired";

export type BillingInterval = "monthly" | "yearly";

export type PaymentProvider = "paddle";

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
