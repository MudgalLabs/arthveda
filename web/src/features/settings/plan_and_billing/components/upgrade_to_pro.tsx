import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";

import { Button, Tooltip } from "netra";
import { isProd } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuthentication, useSubscription, useUserHasProSubscription } from "@/features/auth/auth_context";

interface UpgradeToProProps {
    priceId: string;
    className?: string;
    onClick?: () => void;
}

export function UpgradeToPro(props: UpgradeToProProps) {
    const { priceId, className, onClick } = props;
    const { data } = useAuthentication();
    const hasPro = useUserHasProSubscription();
    const subscription = useSubscription();

    if (!data) {
        return null;
    }

    const [paddle, setPaddle] = useState<Paddle>();

    useEffect(() => {
        initializePaddle({
            environment: isProd() ? "production" : "sandbox",
            token: import.meta.env.ARTHVEDA_PADDLE_CLIENT_TOKEN,
        })
            .then((paddleInstance) => {
                setPaddle(paddleInstance);
            })
            .catch((error) => {
                console.error("failed to initialize paddle:", error);
            });
    }, []);

    const handleCheckout = () => {
        onClick?.();

        if (!paddle) {
            console.error("paddle is not initialized");
            return;
        }

        paddle.Checkout.open({
            items: [
                {
                    priceId: priceId,
                    quantity: 1,
                },
            ],
            settings: {
                allowLogout: false,
                displayMode: "overlay",
                theme: "dark",
                successUrl: isProd()
                    ? "https://web.arthveda.app" + ROUTES.planAndBilling + "?paddle_success=true"
                    : "http://localhost:6969" + ROUTES.planAndBilling + "?paddle_success=true",
            },
            customer: {
                email: data.email,
            },
            customData: {
                user_id: data.user_id,
                email: data.email,
            },
        });
    };

    let disabled = hasPro && !subscription?.cancel_at_period_end;
    disabled = true;

    return (
        <Tooltip
            content={
                <>
                    Please contact us at <a href="mailto:hey@arthveda.app">hey@arthveda.app</a> to upgrade to Pro.
                </>
            }
        >
            {/* <Button className={className} onClick={handleCheckout} disabled={hasPro && !subscription?.cancel_at_period_end}> */}
            <Button className={className} onClick={handleCheckout} disabled={disabled}>
                Upgrade to Pro
            </Button>
        </Tooltip>
    );
}
