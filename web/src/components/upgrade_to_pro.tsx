import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";

import { Button } from "@/s8ly";
import { isProd } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuthentication } from "@/features/auth/auth_context";

export const UpgradeToPro = () => {
    const { data } = useAuthentication();

    if (!data) {
        return null;
    }

    const [paddle, setPaddle] = useState<Paddle>();

    useEffect(() => {
        initializePaddle({
            environment: "sandbox",
            token: import.meta.env.ARTHVEDA_PADDLE_CLIENT_TOKEN,
        })
            .then((paddleInstance) => {
                setPaddle(paddleInstance);
            })
            .catch((error) => {
                console.error("Failed to initialize Paddle:", error);
            });
    }, []);

    const handleCheckout = () => {
        if (!paddle) {
            console.error("Paddle is not initialized");
            return;
        }

        paddle.Checkout.open({
            items: [
                {
                    priceId: "pri_01k0z1y4d8yeynhnr589j02x7k",
                    quantity: 1,
                },
            ],
            settings: {
                allowLogout: false,
                displayMode: "overlay",
                theme: "dark",
                successUrl: isProd()
                    ? "https://web.arthveda.app" + ROUTES.subscription + "?paddle_success=true"
                    : "http://localhost:6969" + ROUTES.subscription + "?paddle_success=true",
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

    return <Button onClick={handleCheckout}>Updgrade</Button>;
};
