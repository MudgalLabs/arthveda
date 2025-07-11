import { FC } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

interface TooltipProps extends TooltipPrimitive.TooltipProps {
    content: React.ReactNode;
    disabled?: boolean;
    contentProps?: TooltipPrimitive.TooltipContentProps;
    variant?: "default" | "info" | "warning" | "error" | "success";
    arrow?: boolean;
}

export const Tooltip: FC<TooltipProps> = ({
    children,
    content,
    disabled,
    variant = "default",
    arrow = false,
    open,
    defaultOpen,
    onOpenChange,
    delayDuration = 100,
    disableHoverableContent,
    ...props
}) => {
    const { contentProps = {} } = props;

    const { className: contentPropsClassName = "", ...contentPropsRest } = contentProps;

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
            <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    className={cn(
                        "z-100 m-2 w-fit max-w-72 rounded-md border-1 px-3 py-2 text-[13px] font-normal text-pretty",
                        {
                            "bg-surface-3 border-border-soft text-text-primary": variant === "default",
                            "bg-surface-bg border-surface-border text-surface-foreground": variant === "info",
                            "bg-success-bg border-success-border text-success-foreground": variant === "success",
                            "bg-warning-bg border-warning-border text-warning-foreground": variant === "warning",
                            "bg-error-bg border-error-border text-error-foreground": variant === "error",
                        },
                        contentPropsClassName
                    )}
                    {...contentPropsRest}
                >
                    {content}
                    {arrow && <TooltipPrimitive.Arrow width={11} height={5} fill="var(--color-accent)" />}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
};
