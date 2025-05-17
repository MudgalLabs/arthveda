type TradeKind = "buy" | "sell";

interface NewTrade {
    kind: TradeKind;
    time: Date;
    quantity: string;
    price: string;
}

interface Trade extends NewTrade {
    id: number;
    position_id: number;
}

export type { NewTrade, Trade, TradeKind };
