import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/s8ly";

const DATA_TABLE_SELECT_COLUMN_ID = "__select__";

// TODO: This should be in @/components and not here?
function getDataTableSelectColumnDef<T>(): ColumnDef<T> {
    return {
        id: DATA_TABLE_SELECT_COLUMN_ID,
        header: ({ table }) => (
            <div className="px-4 py-2">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                // className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    };
}

export { getDataTableSelectColumnDef, DATA_TABLE_SELECT_COLUMN_ID };
