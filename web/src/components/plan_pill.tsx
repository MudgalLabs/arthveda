import { useUserHasProSubscription, useUserIsOnTrial } from "@/features/auth/auth_context";
import { Tag } from "@/s8ly";
import { useMemo } from "react";

export function PlanPill() {
    const isTrial = useUserIsOnTrial();
    const hasPro = useUserHasProSubscription();

    const text = useMemo(() => {
        if (isTrial) {
            return "Pro trial";
        } else if (hasPro) {
            return "Pro";
        } else {
            return "Free";
        }
    }, [isTrial, hasPro]);

    return (
        <Tag variant="primary" size="small">
            {text}
        </Tag>
    );
}
