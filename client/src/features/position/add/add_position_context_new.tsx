import { createContext, useContext, useRef } from "react";
import {
    createPositionStore,
    PositionStore,
} from "@/features/position/position_store";
import { StoreApi, useStore } from "zustand";

const Context = createContext<StoreApi<PositionStore> | null>(null);

export const AddPositionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const store = useRef(
        createPositionStore({
            creatingOrUpdatingPostion: "creating",
        })
    ).current;

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
