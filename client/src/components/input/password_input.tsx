import { FC, useState } from "react";

import { IconEyeClose, IconEyeOpen } from "@/components/icons";
import { Button, Input, InputProps } from "@/s8ly";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/s8ly/tooltip/tooltip";

interface PasswordProps extends InputProps {}

export const PasswordInput: FC<PasswordProps> = (props) => {
    const { className, ...rest } = props;

    const [showingPassword, setShowingPassword] = useState(false);

    return (
        <div className={cn("relative flex w-fit items-center", className)}>
            <Input
                placeholder="Password"
                hidePlaceholderOnFocus
                {...rest}
                // Keep the line below after `{...props}` so that the button
                // to "show/hide" password works properly.
                type={showingPassword ? "text" : "password"}
            />

            <Tooltip
                content={showingPassword ? "Hide" : "Show"}
                contentProps={{ className: "m-3", side: "right" }}
            >
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="text-foreground-muted hover:bg-background! absolute right-2 rounded-md border-transparent"
                    onClick={() => setShowingPassword((prev) => !prev)}
                >
                    {showingPassword ? <IconEyeClose /> : <IconEyeOpen />}
                </Button>
            </Tooltip>
        </div>
    );
};

PasswordInput.displayName = "PasswordInput";
