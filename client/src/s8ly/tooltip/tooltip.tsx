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
    delayDuration = 0,
    disableHoverableContent,
    ...props
}) => {
    const { contentProps = {} } = props;

    const { className: contentPropsClassName = "", ...contentPropsRest } =
        contentProps;

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
            <TooltipPrimitive.Trigger className="peer" asChild>
                {children}
            </TooltipPrimitive.Trigger>

            <div className="opacity-0 transition-opacity duration-150 ease-in-out peer-hover:opacity-100">
                <TooltipPrimitive.Content
                    className={cn(
                        "bg-muted border-border-muted text-foreground 0 z-50 m-2 rounded-md border-1 px-3 py-2 text-sm font-medium",
                        contentPropsClassName
                    )}
                    {...contentPropsRest}
                >
                    {content}
                    <TooltipPrimitive.Arrow
                        width={11}
                        height={5}
                        fill="var(--color-border-muted)"
                    />
                </TooltipPrimitive.Content>
            </div>
        </TooltipPrimitive.Root>
    );
};
