import { Button, ButtonProps } from "@/s8ly";

import { Google } from "@/components/google";
import { FC } from "react";
import { cn, isProd } from "@/lib/utils";

interface ContinueWithGoogleProps extends ButtonProps {}

export const ContinueWithGoogle: FC<ContinueWithGoogleProps> = (props) => {
    const { className, ...rest } = props;

    let googleOAuthURL = import.meta.env.VITE_GOOGLE_OAUTH_URL;

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
            className={cn("", className)}
            onClick={() => {
                window.location.assign(googleOAuthURL);
            }}
            {...rest}
        >
            <Google />
            Continue with Google
        </Button>
    );
};
