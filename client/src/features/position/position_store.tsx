import { createStore } from "zustand";
import { isEqual } from "lodash";

import { Position } from "@/features/position/position";
import { Trade, TradeKind } from "@/features/trade/trade";
import {
    generateId,
    isFunction,
    removeAtIndex,
    roundToNearest15Minutes,
} from "@/lib/utils";
import { Setter } from "@/lib/types";
import { usePositionStore } from "./position_store_context";
import { useDebounce } from "@/hooks/use_debounce";
import { useEffect, useMemo, useRef, useState } from "react";

interface State {
    position: Position;
    initialPosition: Position | null;
}

interface Action {
    updatePosition: (newState: Partial<Position>) => void;
    setTrades: Setter<Trade[]>;
    insertNewTrade: () => void;
    removeTrade: (index: number) => void;
    discard: () => void;
}

export interface PositionStore extends State, Action {}

const defaultState: State = {
    initialPosition: null,

    position: {
        id: "",
        created_at: new Date(),
        updated_at: null,
        created_by: "",
        symbol: "",
        instrument: "equity",
        currency: "inr",
        risk_amount: "",
        total_charges_amount: "",
        opened_at: roundToNearest15Minutes(new Date()),
        closed_at: null,
        direction: "long",
        status: "open",
        gross_pnl_amount: "0",
        net_pnl_amount: "0",
        net_return_percentage: "0",
        r_factor: "0",
        charges_as_percentage_of_net_pnl: "0",
        open_quantity: "0",
        open_average_price_amount: "0",
        trades: [],
    },
};

export const createPositionStore = (initProp?: Position) => {
    const position: Position = initProp ?? defaultState.position;

    if (!position?.trades || position.trades.length === 0) {
        position.trades = [getEmptyTrade("buy")];
    }

    const initialPosition: Position = position;

    return createStore<PositionStore>((set, get) => ({
        initialPosition,
        position,

        updatePosition: (newState) => {
            set((state) => {
                const updatedPosition = {
                    ...state.position,
                    ...newState,
                };

                return {
                    position: updatedPosition,
                };
            });
        },

        setTrades: (newTradesValueOrFn) => {
            const newTrades = isFunction(newTradesValueOrFn)
                ? newTradesValueOrFn(get().position.trades ?? [])
                : newTradesValueOrFn;

            set((state) => {
                return {
                    position: {
                        ...state.position,
                        trades: newTrades,
                    },
                };
            });

            return newTrades;
        },

        insertNewTrade: () => {
            const firstTradeBuyOrSell =
                get().position.trades?.[0]?.kind ?? undefined;

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

            set((state) => ({
                ...state,
                position: {
                    ...state.position,
                    trades: [
                        ...(state.position.trades ?? []),
                        getEmptyTrade(newTradeKind),
                    ],
                },
            }));
        },

        removeTrade: (index) => {
            const prevTrades = get().position.trades ?? [];
            let newTrades = prevTrades;

            if (prevTrades.length > 1) {
                newTrades = removeAtIndex(Array.from(prevTrades), index);
            }

            set((state) => {
                return {
                    ...state,
                    position: {
                        ...state.position,
                        trades: newTrades,
                    },
                };
            });
        },

        discard: () => set(() => ({ position: initialPosition })),
    }));
};

export function usePositionCanBeComputed(): [boolean, Setter<boolean>] {
    const position = usePositionStore((s) => s.position);
    const debouncedPosition = useDebounce(position, 500);
    const prevDebouncedPositionRef = useRef(debouncedPosition);

    const [flag, setFlag] = useState(false);

    useEffect(() => {
        const prevPosition = prevDebouncedPositionRef.current;

        let flag = false;

        if (debouncedPosition.risk_amount !== prevPosition.risk_amount) {
            flag = true;
        }

        if (!isEqual(debouncedPosition.trades, prevPosition.trades)) {
            flag = true;
        }

        setFlag(flag);
        prevDebouncedPositionRef.current = debouncedPosition;
    }, [debouncedPosition]);

    return [flag, setFlag];
}

export function usePositionCanBeDiscarded(): boolean {
    const position = usePositionStore((s) => s.position);
    const initialPosition = usePositionStore((s) => s.initialPosition);

    return useMemo(
        () => !isEqual(position, initialPosition),
        [position, initialPosition]
    );
}

export function usePositionTradesAreValid(): boolean {
    const trades = usePositionStore((s) => s.position.trades);
    if (!trades) {
        return false;
    }
    return useMemo(() => validateTrades(trades), [trades]);
}

export function usePositionCanBeSaved(): boolean {
    const position = usePositionStore((s) => s.position);
    return useMemo(
        () =>
            !!position.symbol &&
            !!position.trades &&
            validateTrades(position.trades),
        [position]
    );
}

function validateTrades(trades: Trade[] = []) {
    return (
        trades.length > 0 &&
        trades.every((t) => Number(t.quantity) !== 0 && Number(t.price) !== 0)
    );
}

function getEmptyTrade(orderKind: TradeKind): Trade {
    return {
        id: generateId("row"),
        position_id: "",
        kind: orderKind,
        time: roundToNearest15Minutes(new Date()),
        price: "",
        quantity: "",
        charges_amount: "",
        broker_trade_id: null,
        created_at: new Date(),
        updated_at: null,
    };
}
