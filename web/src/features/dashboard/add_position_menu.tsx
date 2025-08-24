import { FC, useState } from "react";
import { usePostHog } from "posthog-js/react";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Tooltip,
    IconImport,
    IconPlus,
    IconSync,
    IconSquarePen,
} from "netra";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { Link } from "@/components/link";

interface AddPositionMenuProps {
    sidebarOpen: boolean;
    className?: string;
}

export const AddPositionMenu: FC<AddPositionMenuProps> = ({ sidebarOpen, className }) => {
    const [open, setOpen] = useState(false);

    const posthog = usePostHog();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <Tooltip content="Add Position" contentProps={{ side: "right" }} disabled={sidebarOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn(
                            "w-full rounded-sm p-2 enabled:active:scale-[1]!",
                            {
                                "bg-primary-hover": open,
                                "flex-center! h-9 w-9": !sidebarOpen,
                            },
                            className
                        )}
                    >
                        <IconPlus size={18} />
                        {sidebarOpen ? "Add Position" : ""}
                    </Button>
                </DropdownMenuTrigger>
            </Tooltip>

            <DropdownMenuContent side="right" align="end" className="ml-1 min-w-[180px]">
                <Link
                    to={ROUTES.newPositions}
                    variant="unstyled"
                    onClick={() => posthog?.capture("Clicked Add Position Manually On Dashboard")}
                >
                    <DropdownMenuItem>
                        <IconSquarePen size={18} />
                        Manually
                    </DropdownMenuItem>
                </Link>

                <Link
                    to={ROUTES.importPositions}
                    variant="unstyled"
                    onClick={() => posthog?.capture("Clicked Import Positions From Broker On Dashboard")}
                >
                    <DropdownMenuItem>
                        <IconImport size={18} />
                        Import from file
                    </DropdownMenuItem>
                </Link>

                <Link
                    to={ROUTES.brokerAccounts}
                    variant="unstyled"
                    onClick={() => posthog?.capture("Clicked sync from broker")}
                >
                    <DropdownMenuItem>
                        <IconSync size={18} />
                        Sync from broker
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
