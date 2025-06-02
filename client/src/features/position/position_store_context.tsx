import { createContext, useContext, useRef } from "react";
import {
    createPositionStore,
    PositionStore,
} from "@/features/position/position_store";
import { StoreApi, useStore } from "zustand";
import { Position } from "@/features/position/position";

const Context = createContext<StoreApi<PositionStore> | null>(null);

export const PositionStoreProvider = ({
    children,
    initState,
}: {
    children: React.ReactNode;
    initState?: Position;
}) => {
    const store = useRef(createPositionStore(initState)).current;
    return <Context.Provider value={store}>{children}</Context.Provider>;
};

export function usePositionStore<T>(selector: (state: PositionStore) => T): T {
    const store = useContext(Context);
    if (!store) {
        throw new Error(
            "usePositionStore must be used within PositionProvider"
        );
    }
    return useStore(store, selector);
}
