import { DirectionKind, OrderKind, OutcomeKind } from "@/features/trade/trade";
import { API_ROUTES } from "@/lib/api/api_routes";
import { ApiRes, client } from "@/lib/api/client";

export interface SubTradeForAddRequest {
    order_kind: OrderKind;
    time: Date;
    quantity: string;
    price: string;
}

export interface ComputeForAddRequest {
    planned_risk_amount: string;
    charges_amount: string;
    sub_trades: SubTradeForAddRequest[];
}

export interface ComputeForAddResponse {
    direction: DirectionKind;
    outcome: OutcomeKind;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: string;
    net_pnl_amount: string;
    r_factor: number;
    net_return_percentage: number;
    charges_as_percentage_of_net_pnl: number;
    open_qty: string;
}

export function computeForAdd(body: ComputeForAddRequest) {
    return client.post<ComputeForAddRequest, ApiRes<ComputeForAddResponse>>(
        API_ROUTES.trade.computeForAdd,
        body
    );
}
