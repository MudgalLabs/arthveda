import { FC, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger: FC<
    DropdownMenuPrimitive.DropdownMenuTriggerProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Trigger
        className={cn("outline-none", className)}
        {...props}
    />
);

interface DropdownMenuProps
    extends DropdownMenuPrimitive.DropdownMenuContentProps {
    ref?: Ref<HTMLDivElement>;
}

export const DropdownMenuContent: FC<DropdownMenuProps> = ({
    children,
    ref,
    className,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                className={cn(
                    "bg-primary-950 min-w-[200px] rounded-sm p-1",
                    className
                )}
                {...props}
                ref={ref}
            >
                {children}
                <DropdownMenuPrimitive.Arrow />
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
};

export const DropdownMenuItem: FC<
    DropdownMenuPrimitive.DropdownMenuItemProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "hover:bg-primary-900 flex cursor-pointer items-center justify-start gap-x-3 rounded-sm p-1 outline-none",
            className
        )}
        {...props}
    />
);

export const DropdownMenuSeparator: FC<
    DropdownMenuPrimitive.DropdownMenuSeparatorProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Separator
        className={cn("bg-primary-800 my-1 h-px", className)}
        {...props}
    />
);
