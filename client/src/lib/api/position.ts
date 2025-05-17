import {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
} from "@/features/position/position";
import { NewTrade } from "@/features/trade/trade";
import { API_ROUTES } from "@/lib/api/api_routes";
import { ApiRes, client } from "@/lib/api/client";

export interface ComputePositionRequest {
    risk_amount: string;
    charges_amount: string;
    trades: NewTrade[];
}

export interface ComputePositionResponse {
    direction: PositionDirection;
    outcome: PositionStatus;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: string;
    net_pnl_amount: string;
    r_factor: number;
    net_return_percentage: number;
    charges_as_percentage_of_net_pnl: number;
    open_quantity: string;
    open_average_price_amount: string;
}

export function compute(body: ComputePositionRequest) {
    return client.post<ComputePositionRequest, ApiRes<ComputePositionResponse>>(
        API_ROUTES.position.compute,
        body
    );
}

export interface AddPositionRequest extends ComputePositionRequest {
    symbol: string;
    instrument: PositionInstrument;
    currency_code: CurrencyCode;
}

export interface AddPositionResponse extends Position {}

export function add(body: AddPositionRequest) {
    return client.post<AddPositionRequest, ApiRes<AddPositionResponse>>(
        API_ROUTES.position.add,
        body
    );
}
