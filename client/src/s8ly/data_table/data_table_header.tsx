import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/s8ly";
import {
    IconArrowDown,
    IconArrowUp,
    IconChevronsUpDown,
} from "@/components/icons";

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <Button
                variant="ghost"
                size="small"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting()}
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
