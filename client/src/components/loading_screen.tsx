import React from "react";
import { Loading } from "@/components/loading";
import Logo from "@/assets/logo.svg";

interface LoadingScreenProps {
    withLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    withLogo = false,
}) => {
    console.log({ withLogo });
    return (
        <div className="mt-[10%] flex h-full w-full flex-col items-center gap-y-15">
            {withLogo && <img src={Logo} className="h-[36px]" />}

            <Loading />
        </div>
    );
};
