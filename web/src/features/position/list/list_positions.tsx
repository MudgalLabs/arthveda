import { useMemo } from "react";
import { PageHeading, IconCandlestick, Loading, useDocumentTitle } from "netra";

import { PositionListTable } from "@/features/position/components/position_list_table";
import { useListPositionsStore } from "@/features/position/list_positions_store";
import { prepareFilters } from "@/features/position/utils";
import { apiHooks } from "@/hooks/api_hooks";
import { FreePlanLimitTag } from "@/components/free_plan_limit_tag";

export const Positions = () => {
    useDocumentTitle("Positions • Arthveda");

    const tableState = useListPositionsStore((s) => s.tableState);
    const setTableState = useListPositionsStore((s) => s.setTableState);
    const appliedFilters = useListPositionsStore((s) => s.appliedFilters);

    const queryResult = apiHooks.position.useSearch({
        filters: prepareFilters(appliedFilters),
        pagination: {
            page: tableState.pagination.pageIndex + 1,
            limit: tableState.pagination.pageSize,
        },
        sort:
            tableState.sorting.length === 1
                ? {
                      field: tableState.sorting[0].id,
                      order: tableState.sorting[0].desc ? "desc" : "asc",
                  }
                : undefined,
    });

    const positions = useMemo(() => {
        if (queryResult.data?.data?.items) {
            return Array.from(queryResult.data?.data.items);
        }

        return [];
    }, [queryResult]);

    return (
        <>
            <PageHeading>
                <IconCandlestick size={18} />
                <h1>Positions</h1>
                {queryResult.isFetching && <Loading />}
            </PageHeading>

            <FreePlanLimitTag />

            <div className="h-2" />

            {queryResult?.data && (
                <>
                    <PositionListTable
                        positions={positions}
                        totalItems={queryResult.data.data.pagination.total_items}
                        state={tableState}
                        onStateChange={setTableState}
                        isLoading={queryResult.isLoading}
                        isError={queryResult.isError}
                        isFetching={queryResult.isFetching}
                    />
                </>
            )}
        </>
    );
};

export default Positions;
