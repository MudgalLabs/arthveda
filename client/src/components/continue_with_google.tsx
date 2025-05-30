import { Button, ButtonProps } from "@/s8ly";

import { Google } from "@/components/google";
import { FC } from "react";
import { cn } from "@/lib/utils";

interface ContinueWithGoogleProps extends ButtonProps {}

export const ContinueWithGoogle: FC<ContinueWithGoogleProps> = (props) => {
    const { className, ...rest } = props;
    return (
        <Button
            variant="secondary"
            type="button"
            className={cn("h-10 w-full!", className)}
            {...rest}
        >
            <Google />
            Continue with Google
        </Button>
    );
};
