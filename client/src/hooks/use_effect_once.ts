import { useEffect, useRef } from "react";

const emptyArr = [] as unknown;

const defaultConditionFn = () => true;

export function useEffectOnce<T extends readonly unknown[]>(
    callbackFn: (deps: T) => void,
    dependencies: T = emptyArr as any as T,
    conditionFn: (deps: T) => boolean = defaultConditionFn
) {
    const calledRef = useRef(false);

    useEffect(() => {
        // Check if we have already called the callback.
        if (calledRef.current) return;

        if (conditionFn(dependencies)) {
            callbackFn(dependencies);
            calledRef.current = true;
        }
    }, [callbackFn, conditionFn, ...dependencies]);
}
