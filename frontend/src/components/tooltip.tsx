import { FC } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TooltipProps extends TooltipPrimitive.TooltipProps {
    content: React.ReactNode;
    contentProps?: TooltipPrimitive.TooltipContentProps;
}

export const Tooltip: FC<TooltipProps> = ({
    children,
    content,
    open,
    defaultOpen,
    onOpenChange,
    delayDuration,
    disableHoverableContent,
    ...props
}) => {
    const { contentProps = {} } = props;

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
                className="bg-primary-950 text-primary-100 z-30 m-2 rounded-lg px-3 py-2"
                {...contentProps}
            >
                {content}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Root>
    );
};

export const TooltipProvider = TooltipPrimitive.TooltipProvider;
