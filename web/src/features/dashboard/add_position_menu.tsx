import { FC, useState } from "react";

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/s8ly";
import { IconImport, IconPlus, IconScrollText, IconSync } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes_constants";
import { Link } from "@/components/link";

interface AddPositionMenuProps {
    sidebarOpen: boolean;
    className?: string;
}

export const AddPositionMenu: FC<AddPositionMenuProps> = ({ sidebarOpen, className }) => {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    className={cn(
                        "w-full enabled:active:scale-[1]!",
                        {
                            "bg-primary-hover": open,
                            "h-9 w-9": !sidebarOpen,
                        },
                        className
                    )}
                >
                    <IconPlus size={18} />
                    {sidebarOpen ? "Add Position" : ""}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" className="ml-1 min-w-[180px]">
                <Link to={ROUTES.addPosition} variant="unstyled">
                    <DropdownMenuItem>
                        <IconScrollText size={18} />
                        Add Manually
                    </DropdownMenuItem>
                </Link>

                <Link to={ROUTES.importPositions} variant="unstyled">
                    <DropdownMenuItem>
                        <IconImport size={18} />
                        Import from File
                    </DropdownMenuItem>
                </Link>

                <Link to={ROUTES.brokerAccounts} variant="unstyled">
                    <DropdownMenuItem>
                        <IconSync size={18} />
                        Sync from Broker
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
