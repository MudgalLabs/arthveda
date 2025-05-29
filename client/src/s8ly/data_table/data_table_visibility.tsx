import { Table } from "@tanstack/react-table";

import {
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
} from "@/s8ly";
import { IconColumns } from "@/components/icons";

interface DataTableVisibilityProps<TData> {
    table: Table<TData>;
}

export function DataTableVisibility<TData>({
    table,
}: DataTableVisibilityProps<TData>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="data-[state=open]:bg-accent data-[state=open]:text-foreground h-8 font-normal"
                >
                    <IconColumns size={20} />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== "undefined" &&
                            column.getCanHide()
                    )
                    .map((column) => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                }
                                onSelect={(e) => e.preventDefault()}
                            >
                                {column.columnDef.meta
                                    ?.columnVisibilityHeader || column.id}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
