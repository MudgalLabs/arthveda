import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    CurrencyKind,
    InstrumentKind,
    OrderKind,
} from "@/features/trade/trade";
import { genId, removeAtIndex, roundToNearest15Minutes } from "@/lib/utils";
import { ComputeForAddResponse, SubTradeForAddRequest } from "@/lib/api/trade";
import { apiHooks } from "@/hooks/api_hooks";
import { useDebounce } from "@/hooks/use_debounce";
import { toast } from "@/components/toast";

interface Trade {
    symbol: string;
    instrument: InstrumentKind;
    currency: CurrencyKind;
    planned_risk_amount: string;
    charges_amount: string;
}

interface AddTradeContextType {
    state: Trade;
    setState: Dispatch<SetStateAction<Trade>>;
    subTrades: SubTradeForAddRequest[];
    setSubTrades: Dispatch<SetStateAction<SubTradeForAddRequest[]>>;
    insertNewSubTrade: () => void;
    removeSubTrade: (subTradeID: number) => void;
    processTradeResult: ComputeForAddResponse;
    subTradesAreValid: boolean;
}

function getEmptySubTrade(
    id: number,
    orderKind: OrderKind
): SubTradeForAddRequest {
    return {
        order_kind: orderKind,
        time: roundToNearest15Minutes(new Date()),
        price: "",
        quantity: "",
    };
}

const initialState: Trade = {
    symbol: "",
    instrument: "equity",
    currency: "INR",
    planned_risk_amount: "",
    charges_amount: "",
};

const initialProcessTradeResult: ComputeForAddResponse = {
    opened_at: new Date(),
    closed_at: null,
    direction: "long",
    outcome: "open",
    gross_pnl_amount: "0",
    net_pnl_amount: "0",
    net_return_percentage: 0,
    r_factor: 0,
    charges_as_percentage_of_net_pnl: 0,
    open_qty: "0",
};

const AddTradeContext = createContext<AddTradeContextType>(
    {} as AddTradeContextType
);

function AddTradeContextProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Trade>(() => initialState);
    const debouncedState = useDebounce(state, 350);
    const [subTrades, setSubTrades] = useState<SubTradeForAddRequest[]>(() => [
        getEmptySubTrade(genId(), "buy"),
    ]);
    const [processTradeResult, setProcessTradeResult] =
        useState<ComputeForAddResponse>(() => initialProcessTradeResult);
    const [subTradesAreValid, setSubTradesAreValid] = useState(false);
    const { mutateAsync: computeForAddTrade } =
        apiHooks.trade.useComputeForAddTrade({
            onSuccess: async (res) => {
                const data = res.data.data as ComputeForAddResponse;
                setProcessTradeResult({
                    ...data,
                    opened_at: new Date(data.opened_at),
                    closed_at: data.closed_at ? new Date(data.closed_at) : null,
                });
            },
            onError: (error) => {
                const errorMsg = error.response.data.message;
                toast.error(errorMsg);
            },
        });

    function insertNewSubTrade() {
        const firstSubTradeBuyOrSell = subTrades[0]?.order_kind ?? undefined;

        // We are assuming that if the first sub trade was a BUY trade, then user
        // went LONG on this trade. That's why the subsequent sub trade are most
        // likely going to be SELL trade unless user may have scaled in by doing
        // multiple BUY trade. So this is just a simple guess which can definitely
        // be improved upon with some more complex logic.
        let newSubTradeOrderKind: OrderKind;
        if (firstSubTradeBuyOrSell !== undefined) {
            newSubTradeOrderKind =
                firstSubTradeBuyOrSell === "buy" ? "sell" : "buy";
        } else {
            newSubTradeOrderKind = "buy";
        }

        setSubTrades((prev) => {
            const copy = Array.from(prev);
            copy.push(getEmptySubTrade(genId(), newSubTradeOrderKind));
            return copy;
        });
    }

    function removeSubTrade(index: number) {
        setSubTrades((prev) => {
            const updated = removeAtIndex(Array.from(prev), index);
            return updated;
        });
    }

    useEffect(() => {
        let valid = true;

        for (let i = 0; i < subTrades.length; i += 1) {
            const subTrade = subTrades[i];

            if (
                Number(subTrade.quantity) === 0 ||
                Number(subTrade.price) === 0
            ) {
                valid = false;
            }
        }

        setSubTradesAreValid(valid);
    }, [subTrades]);

    useEffect(() => {
        if (!subTradesAreValid) return;

        computeForAddTrade({
            planned_risk_amount: debouncedState.planned_risk_amount || "0",
            charges_amount: debouncedState.charges_amount || "0",
            sub_trades: subTrades.map((s) => {
                // @ts-ignore
                delete s.id;
                return s;
            }),
        });
    }, [debouncedState, subTradesAreValid]);

    const value = {
        state,
        setState,
        subTrades,
        setSubTrades,
        insertNewSubTrade,
        removeSubTrade,
        processTradeResult,
        subTradesAreValid,
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
        throw new Error(
            "useAddTrade: did you forget to use AddTradeContextProvider?"
        );
    }

    return context;
}

export { AddTradeContextProvider, useAddTrade };
