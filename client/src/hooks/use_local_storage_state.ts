import {
    loadFromLocalStorage,
    LocalStorageKey,
    saveToLocalStorage,
} from "@/lib/utils";
import { isFunction } from "@tanstack/react-table";
import { useEffect, useState } from "react";

interface Options<T> {
    /** Use this function to modify the state however you want before it is persisted. */
    saveFn?: (value: T) => Partial<T>;
    // TOOD: We can do a similar function called `loadFn` to allow logic to run when loading.
}

export function useLocalStorageState<T>(
    /** Unique key that will be used to persist state in LocalStorage. */
    key: LocalStorageKey,
    /**
     * Default value to fallback to in case we don't have anything stored
     * in the LocalStorage. This can also be considered as initial state.
     */
    defaultValue: T,
    /**
     * Additional options that can be passed to modify the default behaviour.
     */
    options?: Options<T>
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(
        () => loadFromLocalStorage(key) ?? defaultValue
    );

    useEffect(() => {
        let toSave: Partial<T> = state;

        if (isFunction(options?.saveFn)) {
            toSave = options.saveFn(state);
        }

        saveToLocalStorage(key, JSON.stringify(toSave));
    }, [state]);

    return [state, setState];
}
