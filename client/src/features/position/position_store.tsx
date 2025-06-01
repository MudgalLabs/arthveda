import { createStore } from "zustand";

import { Position } from "@/features/position/position";
import { Trade, TradeKind } from "@/features/trade/trade";
import {
    generateId,
    isFunction,
    removeAtIndex,
    roundToNearest15Minutes,
} from "@/lib/utils";
import { Setter } from "@/lib/types";

interface State {
    creatingOrUpdatingPostion: "creating" | "updating" | null;
    position: Position;
    isInitialized: boolean;
    tradesAreValid: boolean;
    canSave: boolean;
    isComputing: boolean;
    hasSomethingToDiscard: boolean;
}

interface Action {
    updatePosition: (newPosition: Partial<Position>) => void;
    setIsInitialized: (isInitialized: boolean) => void;
    setTrades: Setter<Trade[]>;
    insertNewTrade: () => void;
    removeTrade: (index: number) => void;
    discard: () => void;
}

export interface PositionStore extends State, Action {}

export type InitPositionStoreProp = Partial<State>;

const defaultState: State = {
    creatingOrUpdatingPostion: null,

    position: {
        id: "",
        created_at: new Date(),
        updated_at: null,
        created_by: "",
        symbol: "",
        instrument: "equity",
        currency: "inr",
        risk_amount: "",
        charges_amount: "",
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

    isInitialized: false,
    tradesAreValid: false,
    canSave: false,
    isComputing: false,
    hasSomethingToDiscard: false,
};

function validateTrades(trades: Trade[] = []) {
    return (
        trades.length > 0 &&
        trades.every((t) => Number(t.quantity) !== 0 && Number(t.price) !== 0)
    );
}

function checkCanSave(state: State): boolean {
    return (
        !!state.position.symbol &&
        !!state.position.trades &&
        validateTrades(state.position.trades)
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
    };
}

export const createPositionStore = (initProp?: InitPositionStoreProp) => {
    const initial = {
        ...defaultState,
        ...initProp,
    };

    if (initProp?.creatingOrUpdatingPostion) {
        if (initProp?.creatingOrUpdatingPostion === "creating") {
            initial.position.trades = [getEmptyTrade("buy")];
        }
    }

    const tradesAreValid = validateTrades(initial.position.trades ?? []);
    const canSave = checkCanSave(initial);

    initial.isInitialized = false;
    initial.tradesAreValid = tradesAreValid;
    initial.canSave = canSave;

    return createStore<PositionStore>((set, get) => ({
        ...initial,

        setIsInitialized: (isInitialized) => {
            set((state) => ({
                ...state,
                isInitialized,
            }));
        },

        updatePosition: (newState) => {
            set((state) => {
                const updatedPosition = {
                    ...state.position,
                    ...newState,
                };
                const canSave = checkCanSave({
                    ...state,
                    position: updatedPosition,
                });
                return {
                    position: updatedPosition,
                    canSave,
                };
            });
        },

        setTrades: (newTradesValueOrFn) => {
            const newTrades = isFunction(newTradesValueOrFn)
                ? newTradesValueOrFn(get().position.trades ?? [])
                : newTradesValueOrFn;

            set((state) => {
                const tradesAreValid = validateTrades(newTrades);
                const updatedPosition = {
                    ...state.position,
                    trades: newTrades,
                };
                const canSave = checkCanSave({
                    ...state,
                    position: updatedPosition,
                });

                return {
                    position: {
                        ...state.position,
                        trades: newTrades,
                    },
                    tradesAreValid,
                    canSave,
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

        discard: () => {
            set((state) => ({ ...state, ...initial }));
        },
    }));
};
