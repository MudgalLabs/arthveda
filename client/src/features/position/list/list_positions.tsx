import { useMemo } from "react";

import { PageHeading } from "@/components/page_heading";
import {
    ListPositionContextProvider,
    useListPositions,
} from "@/features/position/list/list_positions_context";
import { PositionListTable } from "@/features/position/components/position_list_table";

export const ListPositions = () => {
    const { queryResult, tableState, setTableState } = useListPositions();

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
