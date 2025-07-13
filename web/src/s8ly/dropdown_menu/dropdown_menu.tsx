import { FC, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";
import { IconCheck, IconChevronRight, IconCircleFilled } from "@/components/icons";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger: FC<DropdownMenuPrimitive.DropdownMenuTriggerProps> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Trigger className={cn("outline-none", className)} {...props} />
);

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

interface DropdownMenuContentProps extends DropdownMenuPrimitive.DropdownMenuContentProps {
    ref?: Ref<HTMLDivElement>;
    arrow?: boolean;
}

const DropdownMenuContent: FC<DropdownMenuContentProps> = ({ children, ref, arrow, className, ...props }) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                className={cn(
                    "bg-surface-3 border-border-soft rounded-md border-1 p-1 font-normal shadow-2xl",
                    className
                )}
                {...props}
                ref={ref}
            >
                {children}
                {arrow && <DropdownMenuPrimitive.Arrow fill="var(--color-primary)" />}
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
};

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuItem: FC<DropdownMenuPrimitive.DropdownMenuItemProps> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "enabled:hover:bg-secondary-hover text-foreground focus:bg-secondary-hover flex items-center justify-start gap-x-3 rounded-sm p-2 text-sm outline-none",
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
                "focus:bg-secondary-hover enabled:focus:text-text-primary relative flex items-center gap-2 rounded-sm py-1.5 pr-2 pl-10 text-sm outline-hidden select-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
                "enabled:focus:bg-secondary-hover enabled:focus:text-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
            className={cn("p-2 text-sm font-semibold data-[inset]:pl-8", className)}
            {...props}
        />
    );
};

const DropdownMenuSeparator: FC<DropdownMenuPrimitive.DropdownMenuSeparatorProps> = ({ className, ...props }) => (
    <DropdownMenuPrimitive.Separator className={cn("bg-border h-px", className)} {...props} />
);

const DropdownMenuShortcut = ({ className, ...props }: React.ComponentProps<"span">) => {
    return <span className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)} {...props} />;
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
                "focus:bg-overlay-bg-hover focus:text-foreground data-[state=open]:bg-primary data-[state=open]:text-foreground flex cursor-default items-center rounded-sm p-1 text-sm outline-hidden select-none data-[inset]:pl-8",
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
                "bg-surface-bg text-muted-foreground border-border z-20 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border-1 p-1 shadow-lg",
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
