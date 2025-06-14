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
import {
    DateRangeFilter,
    DecimalString,
    SearchRequest,
    SearchResponse,
} from "@/lib/types";

export interface ComputePositionRequest {
    risk_amount: DecimalString;
    trades: CreateTrade[];
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

export interface UpdatePositionRequest extends CreatePositionRequest {
    broker_id?: string | null;
}

export interface UpdatePositionResponse {
    position: Position;
}

export function update(id: string, body: UpdatePositionRequest) {
    return client.patch<UpdatePositionRequest, ApiRes<UpdatePositionResponse>>(
        API_ROUTES.position.update(id),
        body
    );
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
}

export interface PositionSearchRequest
    extends SearchRequest<PositionSearchFilters> {}
export interface PositionSearchResponse extends SearchResponse<Position[]> {}

export function search(body: PositionSearchRequest) {
    return client.post(API_ROUTES.position.search, body);
}

export interface ImportPositionsRequest {
    file: File;
    broker_id: string;
    currency?: CurrencyCode;
    risk_amount?: DecimalString;
    confirm?: boolean;
}
export interface ImportPositionsResponse {
    positions: Position[];
    positions_count: number;
    duplicate_positions_count: number;
    positions_imported_count: number;
    from_date: string;
    to_date: string;
}

export function importPositions(body: ImportPositionsRequest) {
    const formData = new FormData();
    formData.append("file", body.file);
    formData.append("broker_id", body.broker_id);
    formData.append("currency", body.currency || "");
    formData.append("risk_amount", body.risk_amount || "");
    formData.append("confirm", body.confirm === true ? "true" : "false");

    return client.post<ImportPositionsRequest, ApiRes<ImportPositionsResponse>>(
        API_ROUTES.position.import,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
}

export interface GetPositionResponse {
    position: Position;
}

export function getPosition(id: string) {
    return client.get<ApiRes<GetPositionResponse>>(API_ROUTES.position.get(id));
}
