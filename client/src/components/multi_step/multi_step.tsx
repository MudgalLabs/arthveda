import { FC } from "react";

import { useMultiStep } from "@/components/multi_step/use_multi_step";
import { cn } from "@/lib/utils";
import { Button } from "@/s8ly";
import { IconArrowLeft } from "../icons";

interface MultiStepProps {
    steps: React.ReactElement[];
}

export const MultiStep: FC<MultiStepProps> = ({ steps }) => {
    const { currentStepIndex, goto, next, prev, hasNext, hasPrevious } =
        useMultiStep(steps);

    return (
        <>
            <div className="flex-center flex-col">
                <ul className="flex gap-x-8">
                    {steps.map((_, index) => (
                        <li key={index} style={{}}>
                            <button
                                className={cn(
                                    "h-2 w-8 cursor-pointer rounded-md transition-all",
                                    {
                                        "bg-secondary":
                                            index > currentStepIndex,
                                        "bg-primary": index <= currentStepIndex,
                                        "w-24": index === currentStepIndex,
                                    }
                                )}
                                onClick={() => goto(index)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            {steps[currentStepIndex]}

            <div className="flex w-full justify-between gap-x-4 sm:justify-end">
                {hasPrevious && (
                    <Button variant="secondary" onClick={() => prev()}>
                        <IconArrowLeft /> Go back
                    </Button>
                )}

                <Button variant="primary" onClick={() => next()}>
                    {hasNext ? "Continue" : "Finish"}
                </Button>
            </div>
        </>
    );
};
