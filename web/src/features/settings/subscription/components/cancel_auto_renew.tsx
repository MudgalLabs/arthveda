import { useState } from "react";

import { toast } from "@/components/toast";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/s8ly";
import { useSubscription } from "@/features/auth/auth_context";
import { formatDate } from "@/lib/utils";

export function CancelAutoRenew() {
    const [open, setOpen] = useState(false);
    const subscription = useSubscription();

    const { mutate: cancelSubscription } = apiHooks.subscription.useCancelSubscriptionAtPeriodEnd({
        onSuccess: () => {
            toast.success("Subscription scheduled to cancel", {
                description: "Your subscription will be cancelled at the end of the current period.",
            });
            setOpen(false);
        },
        onError: apiErrorHandler,
    });

    if (!subscription) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">Cancel Auto-Renew</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Auto-Renew</DialogTitle>
                    <DialogDescription>Are you sure you want to cancel auto renew?</DialogDescription>
                </DialogHeader>

                <p>
                    Plan will remain active until{" "}
                    <span className="text-text-primary font-medium">
                        {formatDate(new Date(subscription.valid_until))}
                    </span>
                    , after which it will not renew and your plan will be downgraded to Free.
                </p>

                <p>It's sad to see you go! 😔</p>

                <p>
                    Please write to us at{" "}
                    <a className="cursor-pointer!" href="mailto:hey@arthveda.app">
                        hey@arthveda.app
                    </a>{" "}
                    and tell us what we did wrong.
                </p>

                <DialogFooter>
                    <Button type="button" variant="destructive" onClick={() => cancelSubscription()}>
                        Cancel Auto-Renew
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
