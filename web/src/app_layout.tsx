import { FC, PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            {/* Topbar */}
            <div className="z-10 h-[64px] shrink-0">
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
                    <div className="flex h-full justify-center">
                        <div className="w-full max-w-[1440px] px-4">
                            {children}
                            <div className="h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
