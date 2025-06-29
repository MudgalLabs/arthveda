import { FC } from "react";
import { usePostHog } from "posthog-js/react";

import { Button, ButtonProps } from "@/s8ly";
import { Google } from "@/components/google";
import { cn, isProd } from "@/lib/utils";

interface ContinueWithGoogleProps extends ButtonProps {}

export const ContinueWithGoogle: FC<ContinueWithGoogleProps> = (props) => {
    const { className, ...rest } = props;

    const posthog = usePostHog();

    let googleOAuthURL = import.meta.env.ARTHVEDA_GOOGLE_OAUTH_URL;

    if (!googleOAuthURL) {
        if (isProd()) {
            throw new Error("Google OAuth URL is missing");
        } else {
            googleOAuthURL = "http://localhost:1337/v1/auth/oauth/google";
        }
    }

    return (
        <Button
            variant="secondary"
            type="button"
            size="large"
            className={cn("", className)}
            onClick={() => {
                posthog?.capture("Clicked Continue with Google");
                window.location.assign(googleOAuthURL);
            }}
            {...rest}
        >
            <Google />
            Continue with Google
        </Button>
    );
};
