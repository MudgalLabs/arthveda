import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/s8ly";
import {
    IconArrowDown,
    IconArrowUp,
    IconChevronsUpDown,
    IconEyeClose,
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="small"
                        className="data-[state=open]:bg-accent data-[state=open]:text-foreground -ml-3 h-8"
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(false)}
                    >
                        <IconArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(true)}
                    >
                        <IconArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
                        Desc
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => column.toggleVisibility(false)}
                    >
                        <IconEyeClose className="text-muted-foreground/70 h-3.5 w-3.5" />
                        Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
