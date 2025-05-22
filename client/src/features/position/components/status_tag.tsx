import { FC, memo } from "react";
import { Tag } from "@/s8ly";

import { CurrencyCode, PositionStatus } from "@/features/position/position";
import { formatCurrency } from "@/lib/utils";
import { DecimalString } from "@/lib/types";

interface StatusTagProps {
    currency: CurrencyCode;
    status: PositionStatus;
    openQuantity?: DecimalString;
    openAvgPrice?: DecimalString;
}

const StatusTag: FC<StatusTagProps> = memo(
    ({ currency, status, openQuantity = "", openAvgPrice = "" }) => {
        if (status === "win") return <Tag variant="success">Win</Tag>;
        if (status === "loss") return <Tag variant="destructive">Loss</Tag>;
        if (status === "breakeven")
            return <Tag variant="primary">Breakeven</Tag>;

        let openTagContent = "Open";

        if (Number(openQuantity) > 0) {
            openTagContent +=
                " ~ Qty. " +
                openQuantity +
                " Avg. " +
                formatCurrency(openAvgPrice, currency);
        }

        return <Tag variant="muted">{openTagContent}</Tag>;
    }
);

export { StatusTag };
