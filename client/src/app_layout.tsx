import { FC, PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="h-dvh">
            <div className="h-[56px] w-full">
                <Topbar />
            </div>

            <div className="flex h-[calc(100vh-56px)]!">
                <Sidebar />

                <div className="flex h-full w-full justify-center">
                    <div className="m-6 w-full max-w-[1440px]">{children}</div>
                </div>
            </div>
        </div>
    );
};
