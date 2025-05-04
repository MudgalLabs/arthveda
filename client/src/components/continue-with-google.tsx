import { Button } from "@/s8ly";

import { Google } from "@/components/google";
import { FC } from "react";

interface ContinueWithGoogleProps {
    disabled?: boolean;
}

export const ContinueWithGoogle: FC<ContinueWithGoogleProps> = (props) => {
    const { disabled = false } = props;

    return (
        <Button variant="bright" disabled={disabled} type="button">
            <div className="flex gap-x-3">
                <Google />
                Continue with Google
            </div>
        </Button>
    );
};
