import React from "react";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ className = "" }) => {
    return (
        <div className={cn("flex-center h-full w-full", className)}>
            <Loading />
        </div>
    );
};
