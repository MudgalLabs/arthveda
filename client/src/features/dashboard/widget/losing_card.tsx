import { Card, CardContent, CardTitle } from "@/components/card";
import { IconTrendingDown } from "@/components/icons";
import { DecimalString } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { FC } from "react";

interface LosingCardProps {
    lossRate: number;
    lossRFactor: number;
    maxLoss: DecimalString;
    avgLoss: DecimalString;
    lossStreak: number;
}

export const LosingCard: FC<LosingCardProps> = (props) => {
    return (
        <Card className="h-full w-full">
            <CardTitle className="flex items-center justify-between gap-x-2">
                <div className="flex items-center gap-x-2">
                    Losing
                    <IconTrendingDown size={24} />
                </div>

                <div> {props.lossRate}%</div>
            </CardTitle>

            <CardContent>
                <div className="h-2" />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                        <p className="label-muted">R Factor</p>
                        <p className="heading">{props.lossRFactor}</p>
                    </div>

                    <div>
                        <p className="label-muted">Streak</p>
                        <p className="heading">{props.lossStreak}</p>
                    </div>

                    <div>
                        <p className="label-muted">Max</p>
                        <p className="heading">
                            {formatCurrency(props.maxLoss)}
                        </p>
                    </div>

                    <div>
                        <p className="label-muted">Avg</p>
                        <p className="heading">
                            {formatCurrency(props.avgLoss)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
