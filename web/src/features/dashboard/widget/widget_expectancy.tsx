import Decimal from "decimal.js";

import { Card, CardContent, CardTitle } from "@/components/card";
import { PnL } from "@/components/pnl";
import { formatCurrency } from "@/lib/utils";

interface WidgetExpectancyProps {
    expectancy: Decimal;
}

export function WidgetExpectancy(props: WidgetExpectancyProps) {
    const { expectancy } = props;

    return (
        <Card className="gap flex h-full w-full flex-col">
            <CardTitle className="section-heading-muted!">
                <span>Expectancy</span>
            </CardTitle>

            <CardContent>
                <div className="absolute-center big-heading leading-0">
                    <PnL value={expectancy}>{formatCurrency(expectancy.toFixed(2))}</PnL>
                </div>
            </CardContent>
        </Card>
    );
}
