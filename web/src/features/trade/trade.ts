import { DecimalString } from "@/lib/types";

type TradeKind = "buy" | "sell";

interface CreateTrade {
    kind: TradeKind;
    time: Date;
    quantity: DecimalString;
    price: DecimalString;
    charges_amount: DecimalString;
    broker_trade_id: string | null;
}

interface Trade extends CreateTrade {
    id: string;
    position_id: string;
    broker_trade_id: string | null;
    created_at: Date;
    updated_at: Date | null;
}

export type { CreateTrade, Trade, TradeKind };
