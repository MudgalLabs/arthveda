import React, { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";

import { LoadingScreen } from "@/components/loading_screen";
import { BrokerName } from "@/lib/api/broker";

const ImportPositions = lazy(() => import("@/features/position/import/import_positions"));

const ImportPositionsLazy: React.FC = () => {
    const [searchParams] = useSearchParams();

    const brokerId = searchParams.get("broker_id") || "";
    const userBrokerAccountId = searchParams.get("user_broker_account_id") || "";
    const brokerName = searchParams.get("broker_name") as BrokerName;

    return (
        <Suspense fallback={<LoadingScreen />}>
            <ImportPositions brokerId={brokerId} userBrokerAccountId={userBrokerAccountId} brokerName={brokerName} />
        </Suspense>
    );
};

export default ImportPositionsLazy;
