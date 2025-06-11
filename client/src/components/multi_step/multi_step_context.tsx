import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface MultiStepProps {
    noOfSteps: number;
    setNoOfSteps: (noOfSteps: number) => void;
    currentStepIndex: number;
    currentStepId: string;
    setCurrentStepId: (id: string) => void;
    stepIdxToIdRef: React.RefObject<Record<number, string>>;
    hasNext: boolean;
    hasPrevious: boolean;
    goto: (index: number) => void;
    next: () => void;
    prev: () => void;
}

const MultiStepContext = createContext<MultiStepProps>({} as MultiStepProps);

export function MultiStepProvider({ children }: { children: React.ReactNode }) {
    const [noOfSteps, setNoOfSteps] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentStepId, setCurrentStepId] = useState("");
    const stepIdxToIdRef = useRef<Record<number, string>>({});

    const next = useCallback(() => {
        setCurrentStepIndex((i) => {
            const newIdx = Math.min(i + 1, noOfSteps - 1);
            setCurrentStepId(stepIdxToIdRef.current[newIdx] || "");
            return newIdx;
        });
    }, [noOfSteps]);

    const prev = useCallback(() => {
        setCurrentStepIndex((i) => {
            const newIdx = Math.max(i - 1, 0);
            setCurrentStepId(stepIdxToIdRef.current[newIdx] || "");
            return newIdx;
        });
    }, []);

    const goto = useCallback(
        (index: number) => {
            if (index < 0 || index >= noOfSteps) {
                throw new Error("useMultiStep.goto: index out of bounds");
            }

            setCurrentStepId(stepIdxToIdRef.current[index] || "");
            setCurrentStepIndex(index);
        },
        [noOfSteps]
    );

    const value: MultiStepProps = useMemo(
        () => ({
            noOfSteps,
            setNoOfSteps,
            currentStepIndex,
            setCurrentStepIndex,
            currentStepId,
            setCurrentStepId,
            stepIdxToIdRef,
            hasNext: currentStepIndex < noOfSteps - 1,
            hasPrevious: currentStepIndex > 0,
            goto,
            next,
            prev,
        }),
        [noOfSteps, currentStepIndex, currentStepId, goto, next, prev]
    );

    return <MultiStepContext.Provider value={value}>{children}</MultiStepContext.Provider>;
}

export function useMultiStep() {
    const context = useContext(MultiStepContext);

    if (!context) {
        throw new Error("useMultiStep must be used within a MultiStepProvider");
    }

    return context;
}
