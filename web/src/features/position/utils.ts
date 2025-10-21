import { PositionSearchFilters } from "@/lib/api/position";
import { CompareOperator, compareOperatorToString } from "@/components/select/compare_select";
import { formatDate } from "@/lib/utils";
import {
    positionDirectionToString,
    positionInstrumentToString,
    positionStatusToString,
} from "@/features/position/position";
import { Content } from "@tiptap/react";
import { Tag } from "@/lib/api/tag";

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
    tag_ids: [],
    tags: [],
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
    tags: "Tags",
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
    tags: (_, filters) => {
        if (!filters.tags || filters.tags.length === 0) return "Any";
        return filters.tags.map((t) => t.name).join(", ");
    },
};

export function prepareFilters(filters: PositionSearchFilters): PositionSearchFilters {
    const copy: PositionSearchFilters = { ...filters };

    if (copy.gross_pnl) {
        copy.gross_pnl = String(copy.gross_pnl);
    }

    if (copy.net_pnl) {
        copy.net_pnl = String(copy.net_pnl);
    }

    if (copy.r_factor) {
        copy.r_factor = String(copy.r_factor);
    }

    if (copy.charges_percentage) {
        copy.charges_percentage = String(copy.charges_percentage);
    }

    if (copy.net_return_percentage) {
        copy.net_return_percentage = String(copy.net_return_percentage);
    }

    if (copy.tags && copy.tags.length > 0) {
        copy.tag_ids = copy.tags.map((tag: Tag) => tag.id);
    }

    //
    // Remove filter if it's empty because the client expects a number.
    // Empty means don't apply this filter.
    //
    if (copy.r_factor === "") {
        delete copy.r_factor;
    }

    if (copy.net_return_percentage === "") {
        delete copy.net_return_percentage;
    }

    if (copy.charges_percentage === "") {
        delete copy.charges_percentage;
    }

    delete copy.tags;

    return copy;
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
