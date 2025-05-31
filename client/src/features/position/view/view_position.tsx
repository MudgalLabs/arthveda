import { LoadingScreen } from "@/components/loading_screen";
import { apiHooks } from "@/hooks/api_hooks";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { apiErrorHandler } from "@/lib/api";
import { useParams } from "react-router-dom";

const ViewPosition = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, isError, error } =
        apiHooks.position.useGetPosition(id!);

    useEffectOnce(
        (deps) => {
            if (deps.isError) {
                apiErrorHandler(deps.error);
            }
        },
        { isError, error },
        (deps) => deps.isError
    );

    if (isError) {
        return <p className="text-foreground-red">Error loading position</p>;
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <pre>
            <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
    );
};

export default ViewPosition;
