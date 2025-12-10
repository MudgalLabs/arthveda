import { DecimalString } from "@/lib/types";

export type TradeKind = "buy" | "sell";

export interface CreateTrade {
    time: Date;
    kind: TradeKind;
    quantity: DecimalString;
    price: DecimalString;
    charges_amount: DecimalString;

    broker_trade_id: string | null;
}

export interface Trade extends CreateTrade {
    id: string;
    position_id: string;
    created_at: Date;
    updated_at: Date | null;

    realised_gross_pnl?: DecimalString;
    realised_net_pnl?: DecimalString;
    roi?: DecimalString;
    matched_lots?: MatchedLot[];
}

interface MatchedLot {
    qty: DecimalString;
    price_in: DecimalString;
    price_out: DecimalString;
    pnl: DecimalString;
}
