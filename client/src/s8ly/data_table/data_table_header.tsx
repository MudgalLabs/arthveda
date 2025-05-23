import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/s8ly";
import {
    IconArrowDown,
    IconArrowUp,
    IconChevronsUpDown,
} from "@/components/icons";

interface DataTableColumnHeaderProps<TData, TValue> {
    column: Column<TData, TValue>;
    title: string;
    className?: string;
    disabled?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
    disabled = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <Button
                variant="ghost"
                size="small"
                className="mx-1 h-8 w-full justify-start"
                onClick={() => column.toggleSorting()}
                disabled={disabled}
            >
                <span>{title}</span>
                {column.getIsSorted() === "desc" ? (
                    <IconArrowDown />
                ) : column.getIsSorted() === "asc" ? (
                    <IconArrowUp />
                ) : (
                    <IconChevronsUpDown />
                )}
            </Button>
        </div>
    );
}
