import { Button, ButtonProps } from "@/s8ly";

import { Google } from "@/components/google";
import { FC } from "react";

interface ContinueWithGoogleProps extends ButtonProps {}

export const ContinueWithGoogle: FC<ContinueWithGoogleProps> = (props) => {
    return (
        <Button variant="secondary" type="button" className="h-10" {...props}>
            <Google />
            Continue with Google
        </Button>
    );
};
