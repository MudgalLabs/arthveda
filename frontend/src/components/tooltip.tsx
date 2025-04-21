import { FC } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

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

    // This props makes it simpler to toggle Tooltip instead of conditional wrapping.
    if (disabled) return children;

    return (
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
                className="bg-primary-950 text-primary-100 z-30 m-2 rounded-sm px-3 py-2 text-sm font-medium"
                {...contentProps}
            >
                {content}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Root>
    );
};

export const TooltipProvider = TooltipPrimitive.TooltipProvider;
