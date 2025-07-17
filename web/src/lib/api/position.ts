import { CompareOperator } from "@/components/select/compare_select";
import { PositionStatusFilterValue } from "@/components/select/position_status_select";
import {
    CurrencyCode,
    Position,
    PositionDirection,
    PositionInstrument,
    PositionStatus,
} from "@/features/position/position";
import { CreateTrade } from "@/features/trade/trade";
import { API_ROUTES } from "@/lib/api/api_routes";
import { ApiRes, client } from "@/lib/api/client";
import { DateRangeFilter, DecimalString, SearchRequest, SearchResponse } from "@/lib/types";

export interface ComputePositionRequest {
    trades: CreateTrade[];
    risk_amount: DecimalString;
    instrument: PositionInstrument;
    enable_auto_charges: boolean;
    broker_id: string | null; // This needs to be set if `auto_calculate_charges` is true.
}

export interface ComputePositionResponse {
    direction: PositionDirection;
    status: PositionStatus;
    opened_at: string;
    closed_at: string | null;
    gross_pnl_amount: DecimalString;
    net_pnl_amount: DecimalString;
    total_charges_amount: DecimalString;
    r_factor: DecimalString;
    net_return_percentage: DecimalString;
    charges_as_percentage_of_net_pnl: DecimalString;
    open_quantity: DecimalString;
    open_average_price_amount: DecimalString;

    trade_charges: DecimalString[] | null;
}

export function compute(body: ComputePositionRequest, signal?: AbortSignal) {
    return client.post<ComputePositionRequest, ApiRes<ComputePositionResponse>>(API_ROUTES.position.compute, body, {
        signal,
    });
}

export interface CreatePositionRequest {
    symbol: string;
    instrument: PositionInstrument;
    currency: CurrencyCode;
    risk_amount: DecimalString;
    user_broker_account_id: string | null;
    trades: CreateTrade[];

    // Only used for "Compute" when creating/updating a position. This is not stored in the database.
    broker_id: string | null;
}

export interface CreatePositionResponse {
    position: Position;
}

export function create(body: CreatePositionRequest) {
    return client.post<CreatePositionRequest, ApiRes<CreatePositionResponse>>(API_ROUTES.position.create, body);
}

export interface UpdatePositionRequest extends CreatePositionRequest {}

export interface UpdatePositionResponse {
    position: Position;
}

export function update(id: string, body: UpdatePositionRequest) {
    return client.patch<UpdatePositionRequest, ApiRes<UpdatePositionResponse>>(API_ROUTES.position.update(id), body);
}

export function deletePosition(id: string) {
    return client.delete(API_ROUTES.position.deletePosition(id));
}

export interface PositionSearchFilters {
    opened?: DateRangeFilter;
    symbol?: string | "";
    instrument?: PositionInstrument | "";
    direction?: PositionDirection | "";
    status?: PositionStatusFilterValue;
    r_factor?: DecimalString | "";
    r_factor_operator?: CompareOperator;
    gross_pnl?: DecimalString | "";
    gross_pnl_operator?: CompareOperator;
    net_pnl?: DecimalString | "";
    net_pnl_operator?: CompareOperator;
    net_return_percentage?: DecimalString | "";
    net_return_percentage_operator?: CompareOperator;
    charges_percentage?: DecimalString | "";
    charges_percentage_operator?: CompareOperator;
    user_broker_account_id?: string | "";
}

export interface PositionSearchRequest extends SearchRequest<PositionSearchFilters> {}
export interface PositionSearchResponse extends SearchResponse<Position[]> {}

export function search(body: PositionSearchRequest) {
    return client.post(API_ROUTES.position.search, body);
}

export type ChargesCalculationMethod = "auto" | "manual";

export interface ImportPositionsRequest {
    file: File;
    broker_id: string;
    user_broker_account_id: string;
    currency: CurrencyCode;
    risk_amount: DecimalString;
    charges_calculation_method: ChargesCalculationMethod;
    manual_charge_amount: DecimalString;
    confirm: boolean;
    force: boolean;
}
export interface ImportPositionsResponse {
    positions: Position[];
    positions_count: number;
    duplicate_positions_count: number;
    positions_imported_count: number;
    invalid_positions_count: number;
    forced_positions_count: number;
    from_date: string;
    to_date: string;
}

export function importPositions(body: ImportPositionsRequest) {
    const formData = new FormData();
    formData.append("file", body.file);
    formData.append("broker_id", body.broker_id);
    formData.append("user_broker_account_id", body.user_broker_account_id);
    formData.append("currency", body.currency);
    formData.append("risk_amount", body.risk_amount);
    formData.append("charges_calculation_method", body.charges_calculation_method);
    formData.append("manual_charge_amount", body.manual_charge_amount);
    formData.append("confirm", body.confirm === true ? "true" : "false");
    formData.append("force", body.force === true ? "true" : "false");

    return client.post<ImportPositionsRequest, ApiRes<ImportPositionsResponse>>(API_ROUTES.position.import, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export interface GetPositionResponse {
    position: Position;
}

export function getPosition(id: string) {
    return client.get<ApiRes<GetPositionResponse>>(API_ROUTES.position.get(id));
}
