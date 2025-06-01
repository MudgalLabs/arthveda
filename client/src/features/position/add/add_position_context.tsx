import { createContext, useContext, useRef } from "react";
import {
    createPositionStore,
    InitPositionStoreProp,
    PositionStore,
} from "@/features/position/position_store";
import { StoreApi, useStore } from "zustand";

const Context = createContext<StoreApi<PositionStore> | null>(null);

export const AddPositionProvider = ({
    children,
    initState,
}: {
    children: React.ReactNode;
    initState?: InitPositionStoreProp;
}) => {
    const store = useRef(createPositionStore(initState)).current;
    return <Context.Provider value={store}>{children}</Context.Provider>;
};

export function useAddPositionStore<T>(
    selector: (state: PositionStore) => T
): T {
    const store = useContext(Context);
    if (!store) {
        throw new Error(
            "useAddPositionStore must be used within AddPositionProvider"
        );
    }
    return useStore(store, selector);
}
