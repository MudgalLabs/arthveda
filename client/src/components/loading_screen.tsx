import React from "react";
import { Loading } from "@/components/loading";

export const LoadingScreen: React.FC = () => {
    return (
        <div className="mt-[10%] flex h-full w-full justify-center">
            <Loading />
        </div>
    );
};
