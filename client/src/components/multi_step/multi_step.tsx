import { Children, cloneElement, FC, isValidElement, ReactElement, ReactNode, useEffect } from "react";

import { MultiStepProps, MultiStepProvider, useMultiStep } from "@/components/multi_step/multi_step_context";
import { cn } from "@/lib/utils";

interface RootProps {
    children: React.ReactNode;
}

const Root: FC<RootProps> = ({ children }) => {
    return <MultiStepProvider>{children}</MultiStepProvider>;
};

interface StepperContainerProps {
    children: React.ReactNode;
}

const StepperContainer: FC<StepperContainerProps> = ({ children }) => {
    return (
        <div className="flex-center flex-col">
            <ul className="flex gap-x-8">{children}</ul>
        </div>
    );
};

interface StepperProps {
    children: (props: MultiStepProps & { index: number }) => ReactNode;
}

const Stepper: FC<StepperProps> = ({ children }) => {
    const props = useMultiStep();
    const steps = Array.from({ length: props.noOfSteps }).fill(0);
    return steps.map((_, index) => <li key={index}>{children({ index, ...props })}</li>);
};

interface ContentProps {
    children: React.ReactNode;
}

const Content: FC<ContentProps> = ({ children }) => {
    const childrenArray = Children.toArray(children);

    const { setNoOfSteps } = useMultiStep();

    useEffect(() => {
        setNoOfSteps(childrenArray.length);
    }, [childrenArray.length, setNoOfSteps]);

    const enhancedChildren = childrenArray.map((child, index) => {
        if (isValidElement(child)) {
            return cloneElement(child as ReactElement<any>, {
                index,
            });
        }

        return child;
    });

    return <div>{enhancedChildren}</div>;
};

interface StepProps {
    children: React.ReactNode;
    id: string;
    className?: string;
}

const Step: FC<StepProps> = (props) => {
    const { children, id, className } = props;
    const { index } = props as any;

    if (index === undefined) {
        throw new Error("<Step /> must be rendered inside <Content />");
    }

    const { currentStepIndex, stepIdxToIdRef, setCurrentStepId } = useMultiStep();

    stepIdxToIdRef.current[index] = id;

    useEffect(() => {
        if (index === currentStepIndex) {
            setCurrentStepId(id);
        }
    }, []); // Only run once when the component mounts to initialize the step ID.

    return (
        <div
            className={cn(className, {
                hidden: index !== currentStepIndex,
            })}
        >
            {children}
        </div>
    );
};

interface PreviousStepButtonProps {
    children: (props: MultiStepProps) => ReactNode;
}

const PreviousStepButton: FC<PreviousStepButtonProps> = ({ children }) => {
    const props = useMultiStep();
    return children(props);
};

interface NextStepButtonProps {
    children: (props: MultiStepProps) => ReactNode;
}

const NextStepButton: FC<NextStepButtonProps> = ({ children }) => {
    const props = useMultiStep();
    return children(props);
};

export const MultiStep = {
    Root,
    StepperContainer,
    Stepper,
    Content,
    Step,
    PreviousStepButton,
    NextStepButton,
};

export type {
    RootProps,
    StepperContainerProps,
    StepperProps,
    ContentProps,
    StepProps,
    PreviousStepButtonProps,
    NextStepButtonProps,
};
