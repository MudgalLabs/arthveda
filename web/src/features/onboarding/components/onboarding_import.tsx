import { useNavigate, useSearchParams } from "react-router-dom";

import ImportPositions from "@/features/position/import/import_positions";
import { BrokerName } from "@/lib/api/broker";
import { ROUTES } from "@/constants";

export function OnboardingImport() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const brokerId = searchParams.get("broker_id") || "";
    const userBrokerAccountId = searchParams.get("user_broker_account_id") || "";
    const brokerName = searchParams.get("broker_name") as BrokerName;

    return (
        <div className="p-4 pt-8">
            <ImportPositions
                brokerId={brokerId}
                userBrokerAccountId={userBrokerAccountId}
                brokerName={brokerName}
                disablePageHeading
                afterImport={() => {
                    navigate(ROUTES.onboardingMessage);
                }}
            />
        </div>
    );
}
