import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, ErrorMessage, LoadingScreen, Tooltip } from "netra";

import { BrokerSelect } from "@/components/select/broker_select";
import { apiHooks } from "@/hooks/api_hooks";
import { UserBrokerAccount } from "@/lib/api/user_broker_account";
import { useBroker } from "@/features/broker/broker_context";
import { ROUTES } from "@/constants";
import { apiErrorHandler } from "@/lib/api";

export function OnboardingBroker() {
    const navigate = useNavigate();
    const { getBrokerNameById } = useBroker();

    const { data, isLoading } = apiHooks.userBrokerAccount.useList();

    const [brokerId, setBrokerId] = useState("");
    const [brokerAccountId, setBrokerAccountId] = useState("");

    const { mutateAsync: create, isPending: isCreating } = apiHooks.userBrokerAccount.useCreate({
        onSuccess: (res) => {
            setBrokerAccountId(res.data.data.id);
        },
        onError: apiErrorHandler,
    });

    const handleClickContinue = async () => {
        if (!brokerId) return;

        if (!brokerAccountId) {
            await create({
                name: "Primary",
                broker_id: brokerId,
            });

            return;
        }

        const url = new URLSearchParams({
            broker_id: brokerId,
            user_broker_account_id: brokerAccountId,
            broker_name: getBrokerNameById(brokerId),
        });

        navigate(`${ROUTES.onboarding}/import?${url.toString()}`);
    };

    const content = useMemo(() => {
        if (!data) {
            return <ErrorMessage errorMsg="Something went wrong." />;
        }

        const accounts = data.data;

        if (accounts.length > 0) {
            const account = accounts[0];
            setBrokerId(account.broker_id);
            setBrokerAccountId(account.id);

            return <BrokerAccountTile key={account.id} account={account} />;
        }

        return <BrokerSelect required value={brokerId} onValueChange={setBrokerId} />;
    }, [isLoading, data, brokerId]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex-center mt-12">
            <div className="flex-y items-center text-center">
                <h1 className="big-heading">
                    {brokerAccountId
                        ? `Import trades from ${getBrokerNameById(brokerId)}`
                        : "Select your primary broker"}
                </h1>

                <div className="h-4" />

                {content}

                <div className="h-4" />

                <Tooltip disabled={!!brokerId} content="Select a broker to continue">
                    <Button onClick={handleClickContinue} disabled={!brokerId} loading={isCreating}>
                        {brokerAccountId ? "Import trades" : "Confirm broker"}
                    </Button>
                </Tooltip>

                <div className="h-8" />

                <Button variant="link" onClick={() => navigate("/onboarding/message")}>
                    I'll do this later
                </Button>
            </div>
        </div>
    );
}

interface BrokerAccountTileProps {
    account: UserBrokerAccount;
}

function BrokerAccountTile(props: BrokerAccountTileProps) {
    const { account } = props;
    const { getBrokerLogoById, getBrokerNameById } = useBroker();

    return (
        <Card className="flex-x min-w-40">
            <img src={getBrokerLogoById(account.broker_id)} width={48} />
            <h2 className="text-lg font-semibold">{getBrokerNameById(account.broker_id)}</h2>
        </Card>
    );
}
