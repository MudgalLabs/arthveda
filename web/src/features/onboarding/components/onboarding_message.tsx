import { Button } from "netra";
import { useNavigate } from "react-router-dom";

import Me from "@/assets/me.webp";
import { ROUTES } from "@/constants";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";

export function OnboardingMessage() {
    const navigate = useNavigate();

    const { mutateAsync: markAsOnboarded } = apiHooks.user.useMarkAsOnboarded({
        onError: apiErrorHandler,
    });

    const handleOnClick = async () => {
        await markAsOnboarded();
        navigate(ROUTES.dashboard);
    };

    return (
        <div className="flex-center flex-col px-4 pt-12">
            <div className="max-w-xl space-y-4 text-base">
                <div className="flex-center">
                    <img src={Me} width={128} height={128} className="rounded-full" />
                </div>

                <p className="font-semibold">Welcome, and thanks for signing up for Arthveda.</p>

                <p>
                    When I wanted to start journaling my trades, I tried a few existing tools. Most barely supported
                    Indian brokers, and the ones that did were simply too expensive.
                </p>

                <p>So I built Arthveda, a trading journal for Indian traders like me.</p>

                <p>
                    If you ever need a hand, feel free to reach out directly at{" "}
                    <a className="text-base!" href="mailto:shikhar@arthveda.app">
                        shikhar@arthveda.app
                    </a>
                    . I’m here to help.
                </p>

                <p>Thanks again, and all the best for your trading journey.</p>

                <p>— Shikhar Sharma</p>
            </div>

            <div className="h-12" />

            <Button onClick={handleOnClick}>Go to dashboard</Button>
        </div>
    );
}
