import { IconDownload } from "@/components/icons";
import { Button } from "netra";
import { useListPositionsStore } from "@/features/position/list_positions_store";
import { apiHooks } from "@/hooks/api_hooks";
import { prepareFilters } from "../utils";

export function PositionExportButton() {
    const tableState = useListPositionsStore((s) => s.tableState);
    const appliedFilters = useListPositionsStore((s) => s.appliedFilters);

    const { mutate: exportToExcel } = apiHooks.position.useExport();

    function handleClick() {
        exportToExcel({
            filters: prepareFilters(appliedFilters),
            sort:
                tableState.sorting.length === 1
                    ? {
                          field: tableState.sorting[0].id,
                          order: tableState.sorting[0].desc ? "desc" : "asc",
                      }
                    : undefined,
        });
    }

    return (
        <Button variant="secondary" onClick={handleClick}>
            <IconDownload size={18} /> Export
        </Button>
    );
}
