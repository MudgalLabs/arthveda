import { useMemo } from "react";

import { PageHeading } from "@/components/page_heading";
import {
    ListPositionContextProvider,
    useListPositions,
} from "@/features/position/list/list_positions_context";
import { PositionListTable } from "@/features/position/components/position_list_table";
import { useListPositionsStore } from "./list_positions_store";

export const ListPositions = () => {
    const tableState = useListPositionsStore((s) => s.tableState);
    const setTableState = useListPositionsStore((s) => s.setTableState);

    const { queryResult } = useListPositions();

    const positions = useMemo(() => {
        if (queryResult.data?.data?.items) {
            return Array.from(queryResult.data?.data.items);
        }

        return [];
    }, [queryResult]);

    return (
        <>
            <PageHeading
                heading="Positions"
                loading={queryResult?.isFetching}
            />

            {queryResult?.data && (
                <>
                    <PositionListTable
                        positions={positions}
                        totalItems={
                            queryResult.data.data.pagination.total_items
                        }
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

export default () => (
    <ListPositionContextProvider>
        <ListPositions />
    </ListPositionContextProvider>
);
