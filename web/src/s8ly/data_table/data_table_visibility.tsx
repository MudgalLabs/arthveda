import { Table } from "@tanstack/react-table";

import {
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    ScrollArea,
    cn,
} from "netra";
import { IconColumns } from "@/components/icons";
import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";

interface DataTableVisibilityProps<TData> extends DropdownMenuContentProps {
    table: Table<TData>;
}

export function DataTableVisibility<TData>({
    table,
    className,
    ...dropdownMenuContentProps
}: DataTableVisibilityProps<TData>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    className="data-[state=open]:bg-secondary-hover w-full text-sm enabled:active:scale-[1]! sm:w-fit"
                >
                    <IconColumns size={20} />
                    Columns
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className={cn("mt-2 max-h-[300px] min-w-[180px]", className)}
                {...dropdownMenuContentProps}
            >
                <ScrollArea className="max-h-[260px] overflow-y-auto p-1">
                    {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {column.columnDef.meta?.columnVisibilityHeader || column.id}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
