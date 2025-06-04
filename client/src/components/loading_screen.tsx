import React from "react";
import { Loading } from "@/components/loading";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    className?: string;
    withLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    className = "",
    withLogo = false,
}) => {
    return (
        <div
            className={cn(
                "mt-[15%] flex h-full w-full flex-col items-center gap-y-10",
                className
            )}
        >
            {withLogo && <Logo />}

            <Loading />
        </div>
    );
};
