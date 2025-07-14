import { createStore } from "zustand";
import isEqual from "lodash/isEqual";

import { Position } from "@/features/position/position";
import { Trade, TradeKind } from "@/features/trade/trade";
import { generateId, isFunction, removeAtIndex, roundToNearest15Minutes } from "@/lib/utils";
import { Setter } from "@/lib/types";
import { usePositionStore } from "./position_store_context";
import { useDebounce } from "@/hooks/use_debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/routes_constants";

interface State {
    initialPosition: Position | null;
    position: Position;
    enableAutoCharges: boolean;
}

interface Action {
    updatePosition: (newState: Partial<Position>) => void;
    setEnableAutoCharges: (enable: boolean) => void;
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
        notes: "",
        total_charges_amount: "0",
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
        user_broker_account_id: null,

        trades: [],
        user_broker_account: null,
        is_duplicate: false,
    },

    enableAutoCharges: false,
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
        enableAutoCharges: false,

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

        setEnableAutoCharges: (enable) => {
            set(() => ({
                enableAutoCharges: enable,
            }));
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
            const firstTradeBuyOrSell = get().position.trades?.[0]?.kind ?? undefined;

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
                    trades: [...(state.position.trades ?? []), getEmptyTrade(newTradeKind)],
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

        discard: () => set(() => ({ position: initialPosition, enableAutoCharges: false })),
    }));
};

export function usePositionCanBeComputed(): [boolean, Setter<boolean>] {
    const position = usePositionStore((s) => s.position);

    const debouncedPosition = useDebounce(position, 1000);
    const prevDebouncedPositionRef = useRef(debouncedPosition);

    const enableAutoCharges = usePositionStore((s) => s.enableAutoCharges);
    const prevEnableAutoChargesRef = useRef(enableAutoCharges);

    const [flag, setFlag] = useState(false);

    useEffect(() => {
        const prevPosition = prevDebouncedPositionRef.current;

        let hasChanges = false;

        if (debouncedPosition.risk_amount !== prevPosition.risk_amount) {
            hasChanges = true;
        }

        const prevTrades = prevPosition.trades ?? [];
        const debouncedTrades = debouncedPosition.trades ?? [];

        // Check if trades array length changed
        if (prevTrades.length !== debouncedTrades.length) {
            hasChanges = true;
        }

        // Check if any trade data changed
        if (!hasChanges) {
            for (let i = 0; i < debouncedTrades.length; i++) {
                const trade = debouncedTrades[i];
                const prevTrade = prevTrades[i];

                if (
                    !prevTrade ||
                    trade.kind !== prevTrade.kind ||
                    trade.time.getTime() !== prevTrade.time.getTime() ||
                    trade.price !== prevTrade.price ||
                    trade.quantity !== prevTrade.quantity
                ) {
                    hasChanges = true;
                    break;
                }
            }
        }

        if (enableAutoCharges !== prevEnableAutoChargesRef.current) {
            hasChanges = true;
            prevEnableAutoChargesRef.current = enableAutoCharges;
        }

        if (enableAutoCharges) {
            if (debouncedPosition.user_broker_account?.broker_id !== prevPosition.user_broker_account?.broker_id) {
                hasChanges = true;
            }
        }

        // Only set flag to true if there are changes AND trades are valid
        const tradesAreValid = validateTrades(debouncedTrades);
        setFlag(hasChanges && tradesAreValid);

        prevDebouncedPositionRef.current = debouncedPosition;
    }, [debouncedPosition, enableAutoCharges]);

    return [flag, setFlag];
}

export function useHasPositionDataChanged(): boolean {
    const position = usePositionStore((s) => s.position);
    const initialPosition = usePositionStore((s) => s.initialPosition);

    return useMemo(() => !isEqual(position, initialPosition), [position, initialPosition]);
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
    return useMemo(() => !!position.symbol && !!position.trades && validateTrades(position.trades), [position]);
}

export function useIsCreatingPosition(): boolean {
    const location = useLocation();
    // If the current path is the add position route, then we are creating a new position.
    return location.pathname === ROUTES.addPosition;
}

export function useIsEditingPosition(): boolean {
    const position = usePositionStore((s) => s.position);
    const location = useLocation();
    // If the position ID is present in the URL, then we are editing.
    return !!position.id && location.pathname.endsWith(position.id);
}

function validateTrades(trades: Trade[] = []) {
    return trades.length > 0 && trades.every((t) => Number(t.quantity) !== 0 && Number(t.price) !== 0);
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
