import { PageHeading } from "@/components/page_heading";
import { toast } from "@/components/toast";
import { UpgradeToPro } from "@/components/upgrade_to_pro";
import { useSubscription, useUserHasProSubscription } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { Button } from "@/s8ly";

export const Subscription = () => {
    const subscription = useSubscription();
    const hasPro = useUserHasProSubscription();

    const { mutate: cancelSubscription } = apiHooks.user.useCancelSubscriptionAtPeriodEnd({
        onSuccess: () => {
            toast.success("Subscription scheduled to cancel", {
                description: "Your subscription will be cancelled at the end of the current period.",
            });
        },
        onError: apiErrorHandler,
    });

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
        </div>
    );
};

export default Subscription;
