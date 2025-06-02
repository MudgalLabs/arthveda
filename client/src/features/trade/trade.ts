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
    broker_trade_id: string | null;
    created_at: Date;
    updated_at: Date | null;
}

export type { NewTrade, Trade, TradeKind };
