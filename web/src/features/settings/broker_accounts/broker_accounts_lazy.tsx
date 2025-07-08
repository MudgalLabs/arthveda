import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const BrokerAccounts = lazy(() => import("@/features/settings/broker_accounts/broker_accounts"));

const BrokerAccountsLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <BrokerAccounts />
    </Suspense>
);

export default BrokerAccountsLazy;
