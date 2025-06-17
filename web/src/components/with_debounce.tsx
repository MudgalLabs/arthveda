import { memo, ReactNode, useEffect } from "react";

import { useDebounce } from "@/hooks/use_debounce";
import { useWrappedState } from "@/hooks/use_wrapped_state";

interface WithDebounceProps<T> {
    children: (value: T, setValue: (val: T) => void) => React.ReactNode;
    state: T;
    onDebounce: (val: T) => void;
    debounceMs?: number;
}

function WithDebounceInner<T>({ children, state, onDebounce, debounceMs = 300 }: WithDebounceProps<T>) {
    const [value, setValue] = useWrappedState(state);
    const debouncedValue = useDebounce(value, debounceMs);

    useEffect(() => {
        if (debouncedValue !== state) {
            onDebounce(debouncedValue);
        }
    }, [debouncedValue]);

    return <>{children(value, setValue)}</>;
}

export const WithDebounce = memo(WithDebounceInner) as <T>(props: WithDebounceProps<T>) => ReactNode;
