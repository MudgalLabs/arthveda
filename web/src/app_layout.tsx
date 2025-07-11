import { FC, PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            {/* Topbar */}
            {/* <div className="z-10 h-[64px] shrink-0">
                <Topbar />
            </div> */}

            {/* Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-fit shrink-0 overflow-y-auto">
                    <Sidebar />
                </div>

                {/* Main content area */}
                <div className="overflow-none min-w-0 flex-1 sm:p-2 sm:pl-0">
                    <div className="flex h-full min-w-0 justify-center">
                        <div className="bg-surface-1 border-border-subtle w-full min-w-0 overflow-auto px-6 py-4 sm:rounded-md sm:border-1">
                            <div className="min-w-full">{children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
