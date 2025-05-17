type TradeKind = "buy" | "sell";

interface NewTrade {
    kind: TradeKind;
    time: Date;
    quantity: string;
    price: string;
}

interface Trade extends NewTrade {
    id: string;
}

export type { NewTrade, Trade, TradeKind };
