import { FC } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

interface TooltipProps extends TooltipPrimitive.TooltipProps {
    content: React.ReactNode;
    disabled?: boolean;
    contentProps?: TooltipPrimitive.TooltipContentProps;
}

export const Tooltip: FC<TooltipProps> = ({
    children,
    content,
    disabled,
    open,
    defaultOpen,
    onOpenChange,
    delayDuration,
    disableHoverableContent,
    ...props
}) => {
    const { contentProps = {} } = props;

    const { className: contentPropsClassName = "", ...contentPropsRest } =
        contentProps;

    // This props makes it simpler to toggle Tooltip instead of conditional wrapping.
    if (disabled) return children;

    return (
        <TooltipPrimitive.TooltipProvider>
            <TooltipPrimitive.Root
                open={open}
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                delayDuration={delayDuration}
                disableHoverableContent={disableHoverableContent}
            >
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>

                <TooltipPrimitive.Content
                    className={cn(
                        "bg-accent text-foreground 0 z-50 m-2 rounded-md px-3 py-2 text-sm font-medium",
                        contentPropsClassName
                    )}
                    {...contentPropsRest}
                >
                    {content}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.TooltipProvider>
    );
};
