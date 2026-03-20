import Decimal from "decimal.js";
import { Card, CardContent, CardTitle } from "netra";

interface WidgetProfitFactorProps {
    profitFactor: Decimal;
}

export function WidgetProfitFactor({ profitFactor }: WidgetProfitFactorProps) {
    return (
        <Card className="gap flex h-full w-full flex-col">
            <CardTitle className="section-heading-muted!">
                <span>Profit Factor</span>
            </CardTitle>

            <CardContent>
                <div className="absolute-center big-heading leading-0">{profitFactor.toFixed(2)}</div>
            </CardContent>
        </Card>
    );
}
