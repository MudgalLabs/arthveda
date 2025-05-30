import React from "react";
import { Loading } from "@/components/loading";
import { Logo } from "@/components/logo";

interface LoadingScreenProps {
    withLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    withLogo = false,
}) => {
    return (
        <div className="mt-[15%] flex h-full w-full flex-col items-center gap-y-10">
            {withLogo && <Logo />}

            <Loading />
        </div>
    );
};
