import { Loading } from "@/components/loading";
import { apiHooks } from "@/hooks/api_hooks";

export const ListPositions = () => {
    const { data, isLoading } = apiHooks.position.useList();

    if (isLoading) {
        return <Loading />;
    }

    return (
        <>
            <h1>Positions</h1>
            <pre>{JSON.stringify(data, undefined, 2)}</pre>
        </>
    );
};

export default ListPositions;
