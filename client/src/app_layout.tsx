import { FC, PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            {/* Topbar */}
            <div className="z-50 h-[56px] shrink-0">
                <Topbar />
            </div>

            {/* Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-fit shrink-0 overflow-y-auto">
                    <Sidebar />
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex justify-center">
                        <div className="m-6 w-full max-w-[1440px]">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
