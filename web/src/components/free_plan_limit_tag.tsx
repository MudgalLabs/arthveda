import { Tag, IconBadgeInfo, Tooltip } from "netra";

import { useUserHasProSubscription } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";

export function FreePlanLimitTag() {
    const { data } = apiHooks.user.useMe();
    const hasPro = useUserHasProSubscription();
    const positionsHidden = data?.data.positions_hidden || 0;
    const totalPositions = data?.data.total_positions || 0;

    if (!data || hasPro || !positionsHidden) return null;

    return (
        <Tooltip
            content={
                <div className="space-y-2">
                    <p>
                        {positionsHidden}/{totalPositions} positions are older than 12 months and hidden.
                    </p>

                    <p>
                        <Link to={ROUTES.planAndBilling}>Upgrade to Pro</Link> to unlock them.
                    </p>
                </div>
            }
            contentProps={{ className: "max-w-sm" }}
        >
            {/* Wrapped in <span> for Tooltip to work as it needs native element. */}
            <span className="inline-block">
                <Tag size="small" variant="muted" className="flex-x gap-x-1">
                    <IconBadgeInfo />
                    Free plan limit
                </Tag>
            </span>
        </Tooltip>
    );
}
