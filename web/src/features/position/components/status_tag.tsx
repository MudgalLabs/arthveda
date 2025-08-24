import { FC, memo } from "react";
import { Tag } from "netra";

import { CurrencyCode, PositionStatus } from "@/features/position/position";
import { formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";

interface StatusTagProps {
    status: PositionStatus;
    currency?: CurrencyCode;
    openQuantity?: DecimalString;
    openAvgPrice?: DecimalString;
}

const StatusTag: FC<StatusTagProps> = memo(({ currency = "inr", status, openQuantity = "", openAvgPrice = "" }) => {
    if (status === "win") return <Tag variant="success">Win</Tag>;
    if (status === "loss") return <Tag variant="destructive">Loss</Tag>;

    let content = status === "breakeven" ? "Breakeven" : "Open";

    if (Number(openQuantity) > 0) {
        content += " : " + openQuantity + " @ " + formatCurrency(openAvgPrice, { currency });
    }

    return <Tag>{content}</Tag>;
});

export { StatusTag };
