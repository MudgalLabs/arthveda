import {
    createContext,
    FC,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    loadFromLocalStorage,
    LocalStorageKey,
    saveToLocalStorage,
} from "@/lib/utils";

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    toggleSidebar: () => {},
});

export const SidebarProvider: FC<PropsWithChildren> = ({ children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(
        JSON.parse(
            loadFromLocalStorage(LocalStorageKey.SIDEBAR_OPEN) || "false"
        )
    );

    function toggleSidebar() {
        setIsOpen((prev) => !prev);
    }

    useEffect(() => {
        saveToLocalStorage(
            LocalStorageKey.SIDEBAR_OPEN,
            JSON.stringify(isOpen)
        );
    }, [isOpen]);

    return (
        <SidebarContext.Provider
            value={{
                isOpen,
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
