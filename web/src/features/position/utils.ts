import { PositionSearchFilters } from "@/lib/api/position";
import { CompareOperator, compareOperatorToString } from "@/components/select/compare_select";
import { formatDate } from "@/lib/utils";
import {
    positionDirectionToString,
    positionInstrumentToString,
    positionStatusToString,
} from "@/features/position/position";
import { Content } from "@tiptap/react";

export const defaultPositionSearchFilters: PositionSearchFilters = {
    opened: {},
    symbol: "",
    instrument: "",
    direction: "",
    status: "all",
    r_factor: "",
    r_factor_operator: CompareOperator.GTE,
    gross_pnl: "",
    gross_pnl_operator: CompareOperator.GTE,
    net_pnl: "",
    net_pnl_operator: CompareOperator.GTE,
    net_return_percentage: "",
    net_return_percentage_operator: CompareOperator.GTE,
    charges_percentage: "",
    charges_percentage_operator: CompareOperator.GTE,
};

export const positionSearchFiltersLabel: Partial<Record<keyof PositionSearchFilters, string>> = {
    opened: "Opened",
    symbol: "Symbol",
    instrument: "Instrument",
    direction: "Direction",
    status: "Status",
    r_factor: "R Factor",
    gross_pnl: "Gross PnL",
    net_pnl: "Net PnL",
    net_return_percentage: "Net Return %",
    charges_percentage: "Charges %",
};

export const positionSearchFiltersValueFormatter: Partial<
    Record<keyof PositionSearchFilters, (value: any, filters: PositionSearchFilters) => string>
> = {
    opened: (v) => {
        if (!v?.from && !v?.to) return "Any";
        const from = v.from ? formatDate(new Date(v.from)) : "Any";
        const to = v.to ? formatDate(new Date(v.to)) : "Any";
        return `${from} - ${to}`;
    },
    symbol: (v) => String(v).toUpperCase(),
    instrument: (v) => positionInstrumentToString(v),
    direction: (v) => positionDirectionToString(v),
    status: (v) => positionStatusToString(v),
    r_factor: (v, filters) => {
        if (v === "" || !filters.r_factor_operator) return "Any";
        return `${compareOperatorToString(filters.r_factor_operator)} ${v}`;
    },
    gross_pnl: (v, filters) => {
        if (v === "" || !filters.gross_pnl_operator) return "Any";
        return `${compareOperatorToString(filters.gross_pnl_operator)} ${v}`;
    },
    net_pnl: (v, filters) => {
        if (v === "" || !filters.net_pnl_operator) return "Any";
        return `${compareOperatorToString(filters.net_pnl_operator)} ${v}`;
    },
    net_return_percentage: (v, filters) => {
        if (v === "" || !filters.net_return_percentage_operator) return "Any";
        return `${compareOperatorToString(filters.net_return_percentage_operator)} ${v}%`;
    },
    charges_percentage: (v, filters) => {
        if (v === "" || !filters.charges_percentage_operator) return "Any";
        return `${compareOperatorToString(filters.charges_percentage_operator)} ${v}%`;
    },
};

export function prepareFilters(filters: PositionSearchFilters): PositionSearchFilters {
    if (filters.gross_pnl) {
        filters.gross_pnl = String(filters.gross_pnl);
    }

    if (filters.net_pnl) {
        filters.net_pnl = String(filters.net_pnl);
    }

    if (filters.r_factor) {
        filters.r_factor = String(filters.r_factor);
    }

    if (filters.charges_percentage) {
        filters.charges_percentage = String(filters.charges_percentage);
    }

    if (filters.net_return_percentage) {
        filters.net_return_percentage = String(filters.net_return_percentage);
    }

    //
    // Remove filter if it's empty because the client expects a number.
    // Empty means don't apply this filter.
    //
    if (filters.r_factor === "") {
        delete filters.r_factor;
    }

    if (filters.net_return_percentage === "") {
        delete filters.net_return_percentage;
    }

    if (filters.charges_percentage === "") {
        delete filters.charges_percentage;
    }
    return filters;
}

export const URL_KEY_FILTERS = "filters";

// This function traverses the Tiptap JSON content and
// collects all image upload IDs (UUIDs) from image nodes.
export function collectUploadIds(content: Content): string[] {
    const ids: string[] = [];

    function traverse(node: any) {
        if (node.type === "image" && node.attrs?.src) {
            const match = node.attrs.src.match(/\/uploads\/([^/]+)$/);
            if (match) {
                ids.push(match[1]); // the UUID part
            }
        }

        if (node.content) {
            node.content.forEach(traverse);
        }
    }

    traverse(content);
    return ids;
}
