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

import { CurrencyCode, PositionInstrument } from "@/features/position/position";
import {
    generateId,
    removeAtIndex,
    roundToNearest15Minutes,
} from "@/lib/utils";
import { ComputePositionResponse } from "@/lib/api/position";
import { apiHooks } from "@/hooks/api_hooks";
import { useDebounce } from "@/hooks/use_debounce";
import { toast } from "@/components/toast";
import { NewTrade, TradeKind } from "@/features/trade/trade";

interface State {
    symbol: string;
    instrument: PositionInstrument;
    currency_code: CurrencyCode;
    risk_amount: string;
    charges_amount: string;
}

interface AddPositionContextType {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    trades: NewTrade[];
    setTrades: Dispatch<SetStateAction<NewTrade[]>>;
    tradesAreValid: boolean;
    canSave: boolean;
    insertNewTrade: () => void;
    removeTrade: (tradeID: number) => void;
    computeResult: ComputePositionResponse;
    isComputing: boolean;
    showDiscardWarning: boolean;
    discard: () => void;
}

function getEmptyTrade(orderKind: TradeKind): NewTrade {
    return {
        // I am adding this `id` here because tanstack-table needs an `id` on a row
        // function properly and uniquely identify row(s).
        // @ts-ignore
        id: generateId("row"),
        kind: orderKind,
        time: roundToNearest15Minutes(new Date()),
        price: "",
        quantity: "",
    };
}

function getInitialState(): State {
    return {
        symbol: "",
        instrument: "equity",
        currency_code: "INR",
        risk_amount: "",
        charges_amount: "",
    };
}

function getInitialComputeResult(): ComputePositionResponse {
    return {
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
        open_average_price_amount: "0",
    };
}

const AddPositionContext = createContext<AddPositionContextType>(
    {} as AddPositionContextType
);

function AddPositionContextProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>(() => getInitialState());
    const debouncedState = useDebounce(state, 500);

    const [trades, setTrades] = useState<NewTrade[]>(() => [
        getEmptyTrade("buy"),
    ]);
    const debouncedTrades = useDebounce(trades, 500);

    const [computeResult, setComputeResult] = useState<ComputePositionResponse>(
        () => getInitialComputeResult()
    );

    const { mutateAsync: compute, isPending: isComputing } =
        apiHooks.position.useCompute({
            onSuccess: async (res) => {
                const data = res.data.data as ComputePositionResponse;
                setComputeResult({
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

    const tradesAreValid = useMemo(() => {
        let flag = true;

        for (let i = 0; i < trades.length; i += 1) {
            const trade = trades[i];

            if (Number(trade.quantity) === 0 || Number(trade.price) === 0) {
                flag = false;
            }
        }

        return flag;
    }, [trades]);

    const canSave = useMemo(() => {
        if (!tradesAreValid) return false;
        if (!state.symbol) return false;
        return true;
    }, [tradesAreValid, state]);

    const showDiscardWarning = useMemo(() => {
        let flag = false;

        if (state.symbol) flag = true;
        if (state.risk_amount) flag = true;
        if (state.charges_amount) flag = true;
        if (trades.length > 1 || trades[0].quantity || trades[0].price)
            flag = true;

        return flag;
    }, [state, trades]);

    const insertNewTrade = useCallback(() => {
        const firstTradeBuyOrSell = trades[0]?.kind ?? undefined;

        // We are assuming that if the first trade was a BUY trade, then user
        // went LONG on this trade. That's why the subsequent trade are most
        // likely going to be SELL trade unless user may have scaled in by doing
        // multiple BUY trade. So this is just a simple guess which can definitely
        // be improved upon with some more complex logic.
        let newTradeKind: TradeKind;
        if (firstTradeBuyOrSell !== undefined) {
            newTradeKind = firstTradeBuyOrSell === "buy" ? "sell" : "buy";
        } else {
            newTradeKind = "buy";
        }

        setTrades((prev) => {
            const copy = Array.from(prev);
            copy.push(getEmptyTrade(newTradeKind));
            return copy;
        });
    }, [trades]);

    const removeTrade = useCallback((index: number) => {
        setTrades((prev) => {
            if (prev.length > 1) {
                return removeAtIndex(Array.from(prev), index);
            } else {
                return prev;
            }
        });
    }, []);

    const discard = useCallback(() => {
        setState(() => getInitialState());
        setTrades([getEmptyTrade("buy")]);
        setComputeResult(() => getInitialComputeResult());
    }, []);

    useEffect(() => {
        if (!tradesAreValid) return;

        compute({
            risk_amount: debouncedState.risk_amount || "0",
            charges_amount: debouncedState.charges_amount || "0",
            trades: debouncedTrades.map((s) => {
                // @ts-ignore
                delete s.id;
                return s;
            }),
        });
    }, [debouncedState, debouncedTrades]);

    const value = useMemo(
        () => ({
            state,
            setState,
            trades,
            setTrades,
            tradesAreValid,
            insertNewTrade,
            removeTrade,
            computeResult,
            isComputing,
            showDiscardWarning,
            discard,
            canSave,
        }),
        [
            state,
            setState,
            trades,
            setTrades,
            tradesAreValid,
            insertNewTrade,
            removeTrade,
            computeResult,
            isComputing,
            showDiscardWarning,
            discard,
            canSave,
        ]
    );

    return (
        <AddPositionContext.Provider value={value}>
            {children}
        </AddPositionContext.Provider>
    );
}

function useAddPosition() {
    const context = useContext(AddPositionContext);

    if (!context) {
        throw new Error(
            "useAddPosition: did you forget to use AddPositionContextProvider?"
        );
    }

    return context;
}

export { AddPositionContextProvider, useAddPosition };
export type { State };
