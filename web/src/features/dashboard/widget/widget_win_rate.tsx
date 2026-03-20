import { Card, CardContent, CardTitle } from "@/components/card";
import { Tag } from "@/s8ly";

interface AvgWinRateProps {
    winRate: number;
    totalTradesCount: number;
    winsCount: number;
    lossesCount: number;
    breakevensCount: number;
}

export function AvgWinRate(props: AvgWinRateProps) {
    const { winRate, totalTradesCount, winsCount, lossesCount, breakevensCount } = props;

    return (
        <Card className="gap flex h-full w-full flex-col">
            <CardTitle className="section-heading-muted! flex-x justify-between">
                <span>Win Rate</span>
                <span>
                    <Tag variant="muted" size="small" className="text-muted-foreground/70">
                        {totalTradesCount} T
                    </Tag>
                </span>
            </CardTitle>

            <CardContent>
                <div className="absolute-center big-heading leading-0">{winRate.toFixed(1)}%</div>

                <div className="text-muted-foreground flex-x absolute bottom-0 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 justify-center text-sm">
                    <Tag variant="success" size="small">
                        {winsCount} W
                    </Tag>

                    <Tag variant="destructive" size="small">
                        {lossesCount} L
                    </Tag>

                    <Tag variant="primary" size="small">
                        {breakevensCount} BE
                    </Tag>
                </div>
            </CardContent>
        </Card>
    );
}
