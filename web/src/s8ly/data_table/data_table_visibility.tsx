import { Table } from "@tanstack/react-table";

import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuContent } from "@/s8ly";
import { IconColumns } from "@/components/icons";

interface DataTableVisibilityProps<TData> {
    table: Table<TData>;
}

export function DataTableVisibility<TData>({ table }: DataTableVisibilityProps<TData>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    size="small"
                    className="data-[state=open]:bg-accent-muted data-[state=open]:text-foreground w-full text-sm sm:w-fit"
                >
                    <IconColumns size={20} />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
