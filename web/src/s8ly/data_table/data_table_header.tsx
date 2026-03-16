import { ReactNode } from "react";
import { Column } from "@tanstack/react-table";

import { Button } from "netra";
import { cn } from "@/lib/utils";
import { IconArrowDown } from "@/components/icons";

interface DataTableColumnHeaderProps<TData, TValue> {
    title: ReactNode;
    column?: Column<TData, TValue>;
    className?: string;
    classNameButton?: string;
    disabled?: boolean;
    align?: "left" | "right";
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
    classNameButton,
    disabled = false,
    align = "left",
}: DataTableColumnHeaderProps<TData, TValue>) {
    const isSorted = column?.getIsSorted();

    const SortIcon = (
        <div
            className={cn("transition-transform", {
                "opacity-0": !isSorted,
                "opacity-100": isSorted,
                "-rotate-180": isSorted === "asc",
                "rotate-0": isSorted === "desc",
            })}
        >
            <IconArrowDown size={14} />
        </div>
    );

    if (!column || !column.getCanSort()) {
        return (
            <div className={cn("text-text-muted px-4 py-2", align === "right" && "text-right", className)}>{title}</div>
        );
    }

    return (
        <div className={cn("flex items-center", align === "right" ? "justify-end" : "justify-start", className)}>
            <Button
                variant="ghost"
                className={cn(
                    "mx-1 flex h-8 w-full items-center gap-2",
                    align === "right" ? "justify-end" : "justify-start",
                    classNameButton,
                    {
                        "text-foreground font-medium": isSorted,
                    }
                )}
                onClick={() => column.toggleSorting()}
                disabled={disabled}
            >
                {align === "right" && SortIcon}
                <span>{title}</span>
                {align === "left" && SortIcon}
            </Button>
        </div>
    );
}
