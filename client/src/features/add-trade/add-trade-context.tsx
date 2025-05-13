import { SegmentKind } from "@/components/segment_toggle";

import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from "react";

interface SubTrade {
    id: number; // To keep track of unique rows.
    buy_or_sell: "buy" | "sell" | "";
    time: Date[];
    quantity: number;
    price: number;
}

interface AddTradeState {
    symbol: string;
    instrument: SegmentKind;
    planned_risk: number;
    charges: number;
}

interface AddTradeContextType {
    state: AddTradeState;
    setState: Dispatch<SetStateAction<AddTradeState>>;
    subTrades: SubTrade[];
    setSubTrades: Dispatch<SetStateAction<SubTrade[]>>;
    insertNewSubTrade: () => void;
    removeSubTrade: (subTradeID: number) => void;
}

function getEmptySubTrade(id: number): SubTrade {
    return {
        id,
        buy_or_sell: "",
        time: [],
        price: 0,
        quantity: 0,
    };
}

const initialState: AddTradeState = {
    symbol: "",
    instrument: "equity",
    planned_risk: 0,
    charges: 0,
};

const AddTradeContext = createContext<AddTradeContextType>(
    {} as AddTradeContextType
);

function AddTradeContextProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AddTradeState>(() => initialState);
    const [subTrades, setSubTrades] = useState<SubTrade[]>(() => [
        getEmptySubTrade(1),
    ]);

    // TODO: Maybe add some checks/conditions?
    function insertNewSubTrade() {
        setSubTrades((prev) => {
            const copy = Array.from(prev);
            copy.push(getEmptySubTrade(prev.length + 1));
            return copy;
        });
    }

    // TODO: Maybe add some checks/conditions?
    function removeSubTrade(subTradeID: number) {
        setSubTrades((prev) => {
            return Array.from(prev).filter((t) => t.id !== subTradeID);
        });
    }

    const value = {
        state,
        setState,
        subTrades,
        setSubTrades,
        insertNewSubTrade,
        removeSubTrade,
    };

    return (
        <AddTradeContext.Provider value={value}>
            {children}
        </AddTradeContext.Provider>
    );
}

function useAddTrade() {
    const context = useContext(AddTradeContext);

    if (!context) {
        console.error(
            "useAddTrade: did you forget to use AddTradeContextProvider?"
        );
    }

    return context;
}

export { AddTradeContextProvider, useAddTrade };
export type { SubTrade };
