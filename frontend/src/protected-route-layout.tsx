import { FC, PropsWithChildren } from "react";
import { Sidebar } from "./components/sidebar";

export const ProtectedRouteLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="flex gap-x-4">
            <Sidebar />
            <div>{children}</div>
        </div>
    );
};
