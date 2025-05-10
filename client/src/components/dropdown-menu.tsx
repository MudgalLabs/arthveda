import { FC, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger: FC<
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

const DropdownMenuContent: FC<DropdownMenuProps> = ({
    children,
    ref,
    className,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                className={cn(
                    "bg-background-1 border-border rounded-md border-1 p-1",
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

const DropdownMenuItem: FC<DropdownMenuPrimitive.DropdownMenuItemProps> = ({
    className,
    ...props
}) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "hover:bg-muted text-foreground focus:bg-accent flex cursor-pointer items-center justify-start gap-x-3 rounded-sm p-1 text-sm font-semibold outline-none",
            className
        )}
        {...props}
    />
);

const DropdownMenuSeparator: FC<
    DropdownMenuPrimitive.DropdownMenuSeparatorProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Separator
        className={cn("bg-border my-1 h-px", className)}
        {...props}
    />
);

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
};
