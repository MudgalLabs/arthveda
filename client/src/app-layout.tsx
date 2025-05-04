import { FC, PropsWithChildren } from "react";
import { Sidebar } from "./components/sidebar";

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="flex gap-x-4">
            <Sidebar />
            <div className="bg-background-2 mx-auto my-4 w-full max-w-[1200px] rounded-xl px-5 py-4">
                {children}
            </div>
        </div>
    );
};
