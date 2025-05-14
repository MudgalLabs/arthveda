import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from "react";

import {
    OrderKind,
    ProcessTradeResult,
    SubTrade,
    Trade,
} from "@/features/trade/trade";
import { roundToNearest15Minutes } from "@/lib/utils";

interface AddTradeContextType {
    state: Trade;
    setState: Dispatch<SetStateAction<Trade>>;
    subTrades: SubTrade[];
    setSubTrades: Dispatch<SetStateAction<SubTrade[]>>;
    insertNewSubTrade: () => void;
    removeSubTrade: (subTradeID: number) => void;
    processTradeResult: ProcessTradeResult;
}

function getEmptySubTrade(id: number, orderKind: OrderKind): SubTrade {
    return {
        id,
        order_kind: orderKind,
        time: roundToNearest15Minutes(new Date()),
        price: 0,
        quantity: 0,
    };
}

const initialState: Trade = {
    symbol: "",
    instrument: "equity",
    currency: "INR",
    planned_risk_amount: 69,
    charges_amount: 4000,
};

const initialProcessTradeResult: ProcessTradeResult = {
    opened_at: roundToNearest15Minutes(new Date()),
    closed_at: null,
    direction: "long",
    outcome: "open",
    gross_pnl_amount: 0,
    net_pnl_amount: 0,
    net_return_percentage: 0,
    r_factor: 0,
    cost_as_percentage_of_net_pnl: 0,
};

const AddTradeContext = createContext<AddTradeContextType>(
    {} as AddTradeContextType
);

function AddTradeContextProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Trade>(() => initialState);
    const [subTrades, setSubTrades] = useState<SubTrade[]>(() => [
        getEmptySubTrade(1, "buy"),
    ]);
    const [processTradeResult] = useState<ProcessTradeResult>(
        () => initialProcessTradeResult
    );

    // TODO: Maybe add some checks/conditions?
    function insertNewSubTrade() {
        const firstSubTradeBuyOrSell = subTrades[0]?.order_kind ?? "buy";
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
        processTradeResult,
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
