import { useEffect, useState } from "react";

/**
 * A simple hook that allows us to wrap a state so that we can create
 * controlled components without mutating a big state causing a huge rerender.
 */
export function useWrappedState<T>(
    value: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    // Create a copy of the state.
    const [state, setState] = useState<T>(value);

    // Update `state` if the `value` changes externally.
    useEffect(() => setState(value), [value]);

    return [state, setState];
}
