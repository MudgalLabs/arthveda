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
                    className="data-[state=open]:bg-secondary-hover w-full text-sm enabled:active:scale-[1]! sm:w-fit"
                >
                    <IconColumns size={20} />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2 min-w-[180px]">
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
