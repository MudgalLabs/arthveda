import { FC, useState } from "react";
import { usePostHog } from "posthog-js/react";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Tooltip,
    IconPlus,
    IconSquarePen,
    useIsMobile,
    IconZap,
} from "netra";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { Link } from "@/components/link";

interface AddPositionMenuProps {
    sidebarOpen: boolean;
    className?: string;
}

export const AddPositionMenu: FC<AddPositionMenuProps> = ({ sidebarOpen, className }) => {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);

    const posthog = usePostHog();

    const label = "Add positions";

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <Tooltip content={label} contentProps={{ side: "right" }} disabled={sidebarOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn(
                            "scale-100! font-normal!", // Disable the scale effect.
                            {
                                "w-full rounded-sm p-2": sidebarOpen && !isMobile,
                                "mx-auto flex h-9 w-9 items-center justify-center": !sidebarOpen || isMobile,
                            },
                            className
                        )}
                    >
                        <IconPlus size={18} />
                        {sidebarOpen && !isMobile ? label : ""}
                    </Button>
                </DropdownMenuTrigger>
            </Tooltip>

            <DropdownMenuContent side="right" align="start" className="ml-2 min-w-[180px]">
                <Link
                    to={ROUTES.newPositions}
                    variant="unstyled"
                    onClick={() => posthog?.capture("Clicked Add Position Manually On Dashboard")}
                >
                    <DropdownMenuItem>
                        <IconSquarePen size={18} />
                        Add manually
                    </DropdownMenuItem>
                </Link>

                <Link
                    to={ROUTES.brokerAccounts}
                    variant="unstyled"
                    onClick={() => posthog?.capture("Clicked Import Positions From Broker On Dashboard")}
                >
                    <DropdownMenuItem>
                        <IconZap size={18} />
                        From broker
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
