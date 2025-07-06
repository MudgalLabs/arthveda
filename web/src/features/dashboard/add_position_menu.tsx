import { FC, useState } from "react";

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/s8ly";
import { IconChevronDown, IconImport, IconPlus, IconScrollText, IconSync } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes_constants";
import { Link } from "@/components/link";

interface AddPositionMenuProps {
    className?: string;
}

export const AddPositionMenu: FC<AddPositionMenuProps> = ({ className }) => {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="large" className={className}>
                    <IconPlus size={18} />
                    Add Position
                    <IconChevronDown
                        size={18}
                        className={cn("flex-shrink-0 transition-transform duration-200", {
                            "rotate-180": open,
                        })}
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="start" className="mt-2 min-w-[180px]">
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

                <Link to={ROUTES.connectedBrokers} variant="unstyled">
                    <DropdownMenuItem>
                        <IconSync size={18} />
                        Sync from Broker
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
