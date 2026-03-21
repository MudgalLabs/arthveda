import { Card, CardContent, CardTitle } from "@/components/card";
import { PnL } from "@/components/pnl";
import Decimal from "decimal.js";

interface WidgetStreakProps {
    winStreak: number;
    lossStreak: number;
}

export function WidgetStreak(props: WidgetStreakProps) {
    const { winStreak, lossStreak } = props;

    return (
        <Card className="flex h-full w-full flex-col">
            <CardTitle className="section-heading-muted!">Streak</CardTitle>

            <CardContent className="flex-x absolute-center gap-x-4!">
                <PnL value={new Decimal(winStreak)} className="big-heading leading-0">
                    {winStreak}W
                </PnL>

                <span className="text-text-muted text-sm">vs</span>

                <PnL value={new Decimal(lossStreak)} variant="negative" className="big-heading leading-0">
                    {lossStreak}L
                </PnL>
            </CardContent>
        </Card>
    );
}
