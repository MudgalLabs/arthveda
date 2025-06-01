import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { useDebounce } from "@/hooks/use_debounce";

export function useURLState<T>(
    /** Unique key that will be used to persist state in URL. */
    key: string,
    /**
     * Default value to fallback to in case we don't have anything stored
     * in the URL. This can also be considered as initial state.
     */
    defaultValue: T,
    customParsers?: ParserMap
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const location = useLocation();

    // Parse query string to state on mount
    const parsedQuery = useMemo(() => {
        const raw = qs.parse(location.search, {
            ignoreQueryPrefix: true,
            allowDots: true,
        })[key] as T;
        const query = deepParseObject<T>(raw, customParsers);
        return query;
    }, [location.search]);

    const [state, setState] = useState<T>(() => ({
        ...defaultValue,
        ...parsedQuery,
    }));

    const debouncedState = useDebounce(state, 300);

    // Sync URL when state changes.
    useEffect(() => {
        const currentQuery = qs.parse(location.search, {
            ignoreQueryPrefix: true,
            allowDots: true,
        });

        const updatedQuery = {
            ...currentQuery,
            [key]: debouncedState,
        };

        const queryString = qs.stringify(updatedQuery, {
            encodeValuesOnly: true,
            skipNulls: true,
            allowDots: true,
        });

        const newUrl = `${window.location.pathname}?${queryString}`;
        window.history.replaceState(null, "", newUrl);
    }, [debouncedState, key, location.search]);

    return [state, setState];
}

type ParserMap = {
    [key: string]: (value: any) => any;
};

export function deepParseObject<T>(
    input: T,
    customParsers?: ParserMap,
    path: string = ""
): T {
    if (Array.isArray(input)) {
        return input.map((item, idx) =>
            deepParseObject(item, customParsers, `${path}[${idx}]`)
        ) as any;
    }

    if (input && typeof input === "object" && !(input instanceof Date)) {
        const result: any = {};
        for (const key in input) {
            const fullPath = path ? `${path}.${key}` : key;
            const value = (input as any)[key];
            result[key] = deepParseObject(value, customParsers, fullPath);
        }
        return result;
    }

    // String leaf node — apply built-in parsing
    if (typeof input === "string") {
        // Custom parser takes precedence
        if (customParsers?.[path]) {
            return customParsers[path](input);
        }

        // Date ISO check
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
            const date = new Date(input) as any;
            return isNaN(date.getTime()) ? input : date;
        }

        // Number check — skip empty strings
        if (input.trim() !== "" && !isNaN(Number(input))) {
            return Number(input) as any;
        }

        // Boolean check
        if (input === "true") return true as any;
        if (input === "false") return false as any;
    }

    return input;
}
