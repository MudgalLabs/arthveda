import { ReactElement, useState } from "react";

export function useMultiStep(steps: ReactElement[]) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    function next() {
        setCurrentStepIndex((i) => {
            return Math.min(i + 1, steps.length - 1);
        });
    }

    function prev() {
        setCurrentStepIndex((i) => {
            return Math.max(i - 1, 0);
        });
    }

    function goto(index: number) {
        if (index < 0 || index >= steps.length) {
            throw new Error("useMultiStep.goto: index out of bounds");
        }
        setCurrentStepIndex(index);
    }

    return {
        currentStepIndex,
        step: steps[currentStepIndex],
        hasNext: currentStepIndex < steps.length - 1,
        hasPrevious: currentStepIndex > 0,
        goto,
        next,
        prev,
    };
}
