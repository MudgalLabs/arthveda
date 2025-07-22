import { FC } from "react";
import { Card, CardContent, CardTitle } from "@/components/card";
import { IconTrendingDown, IconTrendingUp } from "@/components/icons";
import { DecimalString } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Tooltip } from "@/s8ly";

interface Props {
    isWinning: boolean; // Indicates if the card is for winning or losing
    rate: number;
    rFactor: DecimalString;
    max: DecimalString;
    avg: DecimalString;
    streak: number;
    count: number;
}

export const WidgetGeneralStats: FC<Props> = (props) => {
    return (
        <Card className="flex h-full w-full flex-col gap-y-2">
            <CardTitle className="flex items-center justify-between gap-x-2">
                <div className="flex items-center gap-x-2">
                    <p>{props.isWinning ? "Winning" : "Losing"}</p>
                </div>

                <div className="text-text-muted flex gap-x-1 text-sm">
                    <Tooltip content={props.isWinning ? "Number of winning positions" : "Number of losing positions"}>
                        <p>{props.count}</p>
                    </Tooltip>

                    <p>•</p>

                    <Tooltip content={props.isWinning ? "Win Rate" : "Loss Rate"}>
                        <p>{props.rate.toFixed(2)}%</p>
                    </Tooltip>
                </div>
            </CardTitle>

            <CardContent className="flex-y h-full flex-col justify-between">
                <div className="grid h-full grid-cols-2 gap-x-4">
                    <div className="flex h-full flex-col justify-between">
                        <div>
                            <p className="label-muted">R Factor</p>
                            <p className="sub-heading">{props.rFactor}</p>
                        </div>
                        <div>
                            <p className="label-muted">Streak</p>
                            <p className="sub-heading">{props.streak}</p>
                        </div>
                    </div>
                    <div className="flex h-full flex-col justify-between">
                        <div>
                            <p className="label-muted">Max</p>
                            <p className="sub-heading">{formatCurrency(props.max)}</p>
                        </div>
                        <div>
                            <p className="label-muted">Avg</p>
                            <p className="sub-heading">{formatCurrency(props.avg)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
