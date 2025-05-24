import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";

interface LoadingNewProps {
    size?: number | string;
    color?: string;
    speed?: number | string;
}

export const Loading = (props: LoadingNewProps) => (
    <DotPulse size="25" speed="1" color="var(--color-primary)" {...props} />
);
