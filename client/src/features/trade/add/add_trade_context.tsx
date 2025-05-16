import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CurrencyKind,
    InstrumentKind,
    OrderKind,
} from "@/features/trade/trade";
import {
    generateId,
    removeAtIndex,
    roundToNearest15Minutes,
} from "@/lib/utils";
import { ComputeForAddResponse, SubTrade } from "@/lib/api/trade";
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
    subTrades: SubTrade[];
    setSubTrades: Dispatch<SetStateAction<SubTrade[]>>;
    subTradesAreValid: boolean;
    insertNewSubTrade: () => void;
    removeSubTrade: (subTradeID: number) => void;
    computeForAddResult: ComputeForAddResponse;
    isComputing: boolean;
    showDiscardWarning: boolean;
    discard: () => void;
}

function getEmptySubTrade(orderKind: OrderKind): SubTrade {
    return {
        id: generateId("sub-trade"),
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

const initialComputeResult: ComputeForAddResponse = {
    opened_at: roundToNearest15Minutes(new Date()),
    closed_at: null,
    direction: "long",
    outcome: "open",
    gross_pnl_amount: "0",
    net_pnl_amount: "0",
    net_return_percentage: 0,
    r_factor: 0,
    charges_as_percentage_of_net_pnl: 0,
    open_quantity: "0",
    open_price: "0",
};

const AddTradeContext = createContext<AddTradeContextType>(
    {} as AddTradeContextType
);

function AddTradeContextProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Trade>(() => initialState);
    const debouncedState = useDebounce(state, 500);

    const [subTrades, setSubTrades] = useState<SubTrade[]>(() => [
        getEmptySubTrade("buy"),
    ]);
    const debouncedSubTrades = useDebounce(subTrades, 500);

    const [computeForAddResult, setComputeForAddResult] =
        useState<ComputeForAddResponse>(() => initialComputeResult);

    const subTradesAreValid = useMemo(() => {
        let flag = true;

        for (let i = 0; i < subTrades.length; i += 1) {
            const subTrade = subTrades[i];

            if (
                Number(subTrade.quantity) === 0 ||
                Number(subTrade.price) === 0
            ) {
                flag = false;
            }
        }

        return flag;
    }, [subTrades]);

    const showDiscardWarning = useMemo(() => {
        let flag = false;

        if (state.symbol) flag = true;
        if (state.planned_risk_amount) flag = true;
        if (state.charges_amount) flag = true;
        if (subTrades.length > 1 || subTrades[0].quantity || subTrades[0].price)
            flag = true;

        return flag;
    }, [state, subTrades]);

    const { mutateAsync: computeForAddTrade, isPending: isComputing } =
        apiHooks.trade.useComputeForAddTrade({
            onSuccess: async (res) => {
                const data = res.data.data as ComputeForAddResponse;
                setComputeForAddResult({
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

    const insertNewSubTrade = useCallback(() => {
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
            copy.push(getEmptySubTrade(newSubTradeOrderKind));
            return copy;
        });
    }, [subTrades]);

    const removeSubTrade = useCallback((index: number) => {
        setSubTrades((prev) => {
            if (prev.length > 1) {
                return removeAtIndex(Array.from(prev), index);
            } else {
                return prev;
            }
        });
    }, []);

    const discard = useCallback(() => {
        setState(initialState);
        setSubTrades([getEmptySubTrade("buy")]);
        setComputeForAddResult(initialComputeResult);
    }, []);

    useEffect(() => {
        if (!subTradesAreValid) return;

        computeForAddTrade({
            planned_risk_amount: debouncedState.planned_risk_amount || "0",
            charges_amount: debouncedState.charges_amount || "0",
            sub_trades: debouncedSubTrades.map((s) => {
                // @ts-ignore
                delete s.id;
                return s;
            }),
        });
    }, [debouncedState, debouncedSubTrades]);

    const value = useMemo(
        () => ({
            state,
            setState,
            subTrades,
            setSubTrades,
            subTradesAreValid,
            insertNewSubTrade,
            removeSubTrade,
            computeForAddResult,
            isComputing,
            showDiscardWarning,
            discard,
        }),
        [
            state,
            setState,
            subTrades,
            setSubTrades,
            subTradesAreValid,
            insertNewSubTrade,
            removeSubTrade,
            computeForAddResult,
            isComputing,
            showDiscardWarning,
            discard,
        ]
    );

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
export type { Trade, SubTrade };
