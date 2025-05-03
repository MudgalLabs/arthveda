import { FC, useState } from "react";

import { IconEyeClose, IconEyeOpen } from "@/components/icons";
import { Button, Input, InputProps } from "@/s8ly";

interface PasswordProps extends InputProps {}

export const Password: FC<PasswordProps> = (props) => {
    const [showingPassword, setShowingPassword] = useState(false);

    return (
        <div className="relative box-border flex w-fit items-center">
            <Input
                placeholder="Password"
                hidePlaceholderOnFocus
                {...props}
                // Keep the line below after `{...props}` so that the button
                // to "show/hide" password works properly.
                type={showingPassword ? "text" : "password"}
            />

            <Button
                variant="icon"
                className="absolute right-2 rounded-md"
                onClick={() => setShowingPassword((prev) => !prev)}
            >
                {showingPassword ? <IconEyeClose /> : <IconEyeOpen />}
            </Button>
        </div>
    );
};

Password.displayName = "Password";
