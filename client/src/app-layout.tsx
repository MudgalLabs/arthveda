import { FC, PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="h-dvh">
            <div className="h-[48px] w-full">
                <Topbar />
            </div>

            <div className={`flex h-[calc(100vh-54px)]! gap-x-4`}>
                <Sidebar />

                <div className="bg-background-2 mx-auto my-4 w-full max-w-[1200px] rounded-xl px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
