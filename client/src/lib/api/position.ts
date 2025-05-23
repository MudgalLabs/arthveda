import { CompareOperator } from "@/components/select/compare_select";
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
import {
    DateRangeFilter,
    DecimalString,
    SearchRequest,
    SearchResponse,
} from "@/lib/types";

export interface ComputePositionRequest {
    risk_amount: DecimalString;
    charges_amount: DecimalString;
    trades: NewTrade[];
}

export interface ComputePositionResponse {
    direction: PositionDirection;
    status: PositionStatus;
    opened_at: Date;
    closed_at: Date | null;
    gross_pnl_amount: DecimalString;
    net_pnl_amount: DecimalString;
    r_factor: number;
    net_return_percentage: number;
    charges_as_percentage_of_net_pnl: number;
    open_quantity: DecimalString;
    open_average_price_amount: DecimalString;
}

export function compute(body: ComputePositionRequest) {
    return client.post<ComputePositionRequest, ApiRes<ComputePositionResponse>>(
        API_ROUTES.position.compute,
        body
    );
}

export interface CreatePositionRequest extends ComputePositionRequest {
    symbol: string;
    instrument: PositionInstrument;
    currency: CurrencyCode;
}

export interface CreatePositionResponse {
    position: Position;
}

export function create(body: CreatePositionRequest) {
    return client.post<CreatePositionRequest, ApiRes<CreatePositionResponse>>(
        API_ROUTES.position.create,
        body
    );
}

export interface PositionSearchFilters {
    opened?: DateRangeFilter;
    symbol?: string;
    instrument?: PositionInstrument | "";
    direction?: PositionDirection | "";
    status?: PositionStatus | "";
    r_factor?: number | "";
    r_factor_operator?: CompareOperator;
    gross_pnl?: DecimalString | "";
    gross_pnl_operator?: CompareOperator;
    net_pnl?: DecimalString | "";
    net_pnl_operator?: CompareOperator;
    charges_percentage?: number | "";
    charges_percentage_operator?: CompareOperator;
    net_return_percentage?: number | "";
    net_return_percentage_operator?: CompareOperator;
}

export interface PositionSearchResponse extends SearchResponse<Position[]> {}
export interface PositionSearchRequest
    extends SearchRequest<PositionSearchFilters> {}

export function search(body: PositionSearchRequest) {
    return client.post(API_ROUTES.position.search, body);
}
