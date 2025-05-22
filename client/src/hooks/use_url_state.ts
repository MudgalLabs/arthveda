import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { useDebounce } from "@/hooks/use_debounce";

export function useURLState<T>(
    /** Unique key that will be used to persist state in URL. */
    key: string,
    /**
     * Default value to fallback to in case we don't have anything stored
     * in the URL. This can also be considered as initial state.
     */
    defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse query string to state on mount
    const parsedQuery = useMemo(() => {
        return qs.parse(location.search, {
            ignoreQueryPrefix: true,
            allowDots: true,
        });
    }, [location.search]);

    const [state, setState] = useState<T>(() => ({
        ...defaultValue,
        // @ts-ignore
        ...parsedQuery[key],
    }));

    const debouncedState = useDebounce(state, 300);

    // Sync URL when state changes.
    useEffect(() => {
        const queryString = qs.stringify(
            {
                [key]: debouncedState,
            },
            {
                encodeValuesOnly: true,
                skipNulls: true,
                allowDots: true,
            }
        );

        navigate(`?${queryString}`, { replace: true });
    }, [debouncedState, navigate]);

    return [state, setState];
}
