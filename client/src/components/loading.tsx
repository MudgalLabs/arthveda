import { Leapfrog } from "ldrs/react";
import "ldrs/react/Leapfrog.css";

interface LoadingNewProps {
    size?: number | string;
    color?: string;
    speed?: number | string;
}

export const Loading = (props: LoadingNewProps) => (
    <Leapfrog size="25" speed="1.69" color="var(--color-primary)" {...props} />
);
