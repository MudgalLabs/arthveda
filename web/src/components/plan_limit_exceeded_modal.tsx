import { create } from "zustand";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "netra";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { useUserHasProSubscription } from "@/features/auth/auth_context";

// Keep this in sync with - arthveda/api/internal/domain/subscription/core.go
const enum Feature {
    AddUserBrokerAccount = "add_user_broker_account",
}

interface UpgradeModalStore {
    isVisible: boolean;
    feature: Feature | "";
    showUpgradeModal: (feature: Feature | "") => void;
    hideUpgradeModal: () => void;
}

export const useUpgradeModalStore = create<UpgradeModalStore>((set) => ({
    isVisible: true,
    feature: "",

    showUpgradeModal: (feature: Feature | "") => set({ isVisible: true, feature }),

    hideUpgradeModal: () => set({ isVisible: false, feature: "" }),
}));

interface DialogData {
    title: string;
    messageFreePlan: string;
    messageProPlan: string;
    freePlanLimit: number;
    proPlanLimit: number;
}

const dialogDataByFeature: Record<Feature, DialogData> = {
    [Feature.AddUserBrokerAccount]: {
        title: "Add more broker accounts",
        messageFreePlan: "You have reached your limit for adding broker accounts. Need more? Upgrade to Pro.",
        messageProPlan:
            "You have reached your limit for adding broker accounts. Please delete old broker accounts to add new ones. You can contact us at hey@arthveda.app for more help.",
        freePlanLimit: 2,
        proPlanLimit: 10,
    },
};

export default function PlanLimitExceededModal() {
    const { isVisible, feature, hideUpgradeModal } = useUpgradeModalStore();
    const isPro = useUserHasProSubscription();

    if (feature === "") {
        return null;
    }

    const { title, messageFreePlan, messageProPlan, freePlanLimit, proPlanLimit } = dialogDataByFeature[feature];

    return (
        <Dialog open={isVisible} onOpenChange={hideUpgradeModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="heading!">{title}</DialogTitle>
                </DialogHeader>

                {isPro ? messageProPlan : messageFreePlan}

                {isPro ? (
                    <>
                        <DialogFooter>
                            <Button onClick={hideUpgradeModal}>Close</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <div className="flex-x">
                            <PlanCard type="free">{freePlanLimit}</PlanCard>
                            <PlanCard type="pro">{proPlanLimit}</PlanCard>
                        </div>

                        <DialogFooter>
                            <Link to={ROUTES.planAndBilling} onClick={hideUpgradeModal}>
                                <Button>Upgrade now</Button>
                            </Link>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface PlanCardProps {
    children: React.ReactNode;
    type: "free" | "pro";
}

function PlanCard({ children, type }: PlanCardProps) {
    const isFree = type === "free";

    return (
        <div
            className={cn("w-full rounded-md px-3 py-2", {
                "bg-secondary": isFree,
                "border-primary border-1": !isFree,
            })}
        >
            <p className="text-xs">{isFree ? "Current plan" : "Recommended"}</p>

            <div className="flex-x text-text-primary justify-between text-base">
                <p className="font-bold">{isFree ? "Free" : "Pro"}</p>
                <div>{children}</div>
            </div>
        </div>
    );
}
