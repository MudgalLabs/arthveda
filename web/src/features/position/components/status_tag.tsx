import { FC, memo } from "react";
import { Tag } from "@/s8ly";

import { CurrencyCode, PositionStatus } from "@/features/position/position";
import { formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";

interface StatusTagProps {
    status: PositionStatus;
    currency?: CurrencyCode;
    openQuantity?: DecimalString;
    openAvgPrice?: DecimalString;
}

const StatusTag: FC<StatusTagProps> = memo(({ currency = "INR", status, openQuantity = "", openAvgPrice = "" }) => {
    if (status === "win")
        return (
            <Tag className="w-12" variant="success">
                Win
            </Tag>
        );
    if (status === "loss")
        return (
            <Tag className="w-12" variant="destructive">
                Loss
            </Tag>
        );

    let content = status === "breakeven" ? "Breakeven" : "Open";

    if (Number(openQuantity) > 0) {
        content += " : " + openQuantity + " @ " + formatCurrency(openAvgPrice, { currency, signDisplay: "auto" });
    }

    return <Tag variant="primary">{content}</Tag>;
});

export { StatusTag };
