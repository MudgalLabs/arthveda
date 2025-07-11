import { createContext, FC, PropsWithChildren, useContext } from "react";

import { LocalStorageKeySidebarOpen } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/use_local_storage_state";

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    setIsOpen: () => {},
    toggleSidebar: () => {},
});

export const SidebarProvider: FC<PropsWithChildren> = ({ children }) => {
    const [isOpen, setIsOpen] = useLocalStorageState<boolean>(LocalStorageKeySidebarOpen, true);

    function toggleSidebar() {
        setIsOpen((prev) => !prev);
    }

    return (
        <SidebarContext.Provider
            value={{
                isOpen,
                setIsOpen,
                toggleSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};

export function useSidebar(): SidebarContextType {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error("useSidebar: did you forget to use SidebarProvider?");
    }

    return context;
}
