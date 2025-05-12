import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface WithCompareProps {
    Compare: ReactNode;
    children: ReactNode;
    className?: string;
}

function WithCompare(props: WithCompareProps) {
    const { Compare, children, className } = props;

    return (
        <div className={cn("flex gap-x-2", className)}>
            {Compare}
            {children}
        </div>
    );
}

export { WithCompare };
