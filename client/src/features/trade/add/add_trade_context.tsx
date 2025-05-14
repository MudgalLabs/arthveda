import { BuyOrSellState } from "@/components/toggle/buy_or_sell_toggle";
import { SegmentKind } from "@/components/toggle/segment_toggle";

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
    buy_or_sell: BuyOrSellState;
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

function getEmptySubTrade(id: number, buyOrSell: BuyOrSellState): SubTrade {
    return {
        id,
        buy_or_sell: buyOrSell,
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
        getEmptySubTrade(1, "buy"),
    ]);

    // TODO: Maybe add some checks/conditions?
    function insertNewSubTrade() {
        const firstSubTradeBuyOrSell = subTrades[0]?.buy_or_sell ?? "buy";
        // We are assuming that if the first sub trade was a BUY trade, then user
        // went LONG on this trade. That's why the subsequent sub trade are most
        // likely going to be SELL trade unless user may have scaled in by doing
        // multiple BUY trade. So this is just a simple guess which can definitely
        // be improved upon with some more complex logic.
        const newSubTradeBuyOrSell =
            firstSubTradeBuyOrSell === "buy" ? "sell" : "buy";

        setSubTrades((prev) => {
            const copy = Array.from(prev);
            copy.push(getEmptySubTrade(prev.length + 1, newSubTradeBuyOrSell));
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
