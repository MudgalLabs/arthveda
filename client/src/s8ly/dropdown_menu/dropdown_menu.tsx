import { FC, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";
import {
    IconCheck,
    IconChevronRight,
    IconCircleFilled,
} from "@/components/icons";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger: FC<
    DropdownMenuPrimitive.DropdownMenuTriggerProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Trigger
        className={cn("outline-none", className)}
        {...props}
    />
);

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

interface DropdownMenuContentProps
    extends DropdownMenuPrimitive.DropdownMenuContentProps {
    ref?: Ref<HTMLDivElement>;
}

const DropdownMenuContent: FC<DropdownMenuContentProps> = ({
    children,
    ref,
    className,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                className={cn(
                    "bg-muted border-border rounded-md border-1 p-1 font-medium",
                    className
                )}
                {...props}
                ref={ref}
            >
                {children}
                <DropdownMenuPrimitive.Arrow fill="var(--color-border-muted)" />
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
};

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuItem: FC<DropdownMenuPrimitive.DropdownMenuItemProps> = ({
    className,
    ...props
}) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "hover:bg-muted text-foreground focus:bg-accent flex cursor-pointer items-center justify-start gap-x-3 rounded-sm p-1 text-sm outline-none",
            className
        )}
        {...props}
    />
);

const DropdownMenuCheckboxItem = ({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            className={cn(
                "focus:bg-accent focus:text-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none hover:cursor-pointer data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            checked={checked}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <IconCheck className="size-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
};

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuRadioItem = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) => {
    return (
        <DropdownMenuPrimitive.RadioItem
            className={cn(
                "focus:bg-accent focus:text-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <IconCircleFilled className="size-2 fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
};

const DropdownMenuLabel = ({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) => {
    return (
        <DropdownMenuPrimitive.Label
            data-inset={inset}
            className={cn(
                "p-1 text-sm font-semibold data-[inset]:pl-8",
                className
            )}
            {...props}
        />
    );
};

const DropdownMenuSeparator: FC<
    DropdownMenuPrimitive.DropdownMenuSeparatorProps
> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Separator
        className={cn("bg-border my-1 h-px", className)}
        {...props}
    />
);

const DropdownMenuShortcut = ({
    className,
    ...props
}: React.ComponentProps<"span">) => {
    return (
        <span
            className={cn(
                "text-muted-foreground ml-auto text-xs tracking-widest",
                className
            )}
            {...props}
        />
    );
};

const DropdownMenuSub = DropdownMenuPrimitive.DropdownMenuSub;

const DropdownMenuSubTrigger = ({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) => {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-inset={inset}
            className={cn(
                "focus:bg-accent focus:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground flex cursor-default items-center rounded-sm p-1 text-sm outline-hidden select-none hover:cursor-pointer data-[inset]:pl-8",
                className
            )}
            {...props}
        >
            {children}
            <IconChevronRight className="ml-auto size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
};

const DropdownMenuSubContent = ({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) => {
    return (
        <DropdownMenuPrimitive.SubContent
            className={cn(
                "bg-muted text-muted-foreground border-border z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border-1 p-1 shadow-lg",
                className
            )}
            {...props}
        />
    );
};

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
