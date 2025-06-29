import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/s8ly";
import { IconArrowDown } from "@/components/icons";

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
        return <div className={cn("px-4 py-2", className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <Button
                variant={column.getIsSorted() ? "secondary" : "ghost"}
                className={cn("mx-1 h-8 w-full justify-start", {
                    "text-foreground font-semibold": column.getIsSorted(),
                })}
                onClick={() => column.toggleSorting()}
                disabled={disabled}
            >
                <span>{title}</span>
                {
                    <div
                        className={cn({
                            "opacity-0": !column.getIsSorted(),
                            "opacity-100": column.getIsSorted(),
                            "-rotate-180 transition-transform": column.getIsSorted() === "asc",
                            "rotate-0 transition-transform": column.getIsSorted() === "desc",
                        })}
                    >
                        <IconArrowDown size={16} />
                    </div>
                }
            </Button>
        </div>
    );
}
