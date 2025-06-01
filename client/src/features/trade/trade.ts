import { DecimalString } from "@/lib/types";

type TradeKind = "buy" | "sell";

interface NewTrade {
    kind: TradeKind;
    time: Date;
    quantity: DecimalString;
    price: DecimalString;
}

interface Trade extends NewTrade {
    id: string;
    position_id: string;
}

export type { NewTrade, Trade, TradeKind };
