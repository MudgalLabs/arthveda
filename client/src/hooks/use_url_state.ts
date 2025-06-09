import { useEffect, useRef, useState } from "react";
import isEqual from "lodash/isEqual";

import { useDebounce } from "@/hooks/use_debounce";
import { loadFromURL, LoadFromURLParser, saveToURL } from "@/lib/utils";

export function useURLState<T>(
    /** Unique key that will be used to persist state in URL. */
    key: string,
    /**
     * Default value to fallback to in case we don't have anything stored
     * in the URL. This can also be considered as initial state.
     */
    defaultValue: T,
    customParsers?: LoadFromURLParser
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() =>
        loadFromURL(key, defaultValue, customParsers)
    );
    const previousStateRef = useRef<T>(state);
    const debouncedState = useDebounce(state, 300);

    // Sync URL when state changes.
    useEffect(() => {
        if (!isEqual(debouncedState, previousStateRef.current)) {
            saveToURL(key, debouncedState);
            previousStateRef.current = debouncedState;
        }
    }, [debouncedState, key]);

    return [state, setState];
}
