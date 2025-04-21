import { FC, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

interface DropdownMenuProps
    extends DropdownMenuPrimitive.DropdownMenuContentProps {
    ref?: Ref<HTMLDivElement>;
}

export const DropdownMenuContent: FC<DropdownMenuProps> = ({
    children,
    ref,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content {...props} ref={ref}>
                {children}
                <DropdownMenuPrimitive.Arrow />
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
};

export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;
