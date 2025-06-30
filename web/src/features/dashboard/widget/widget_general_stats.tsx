import { FC } from "react";
import { Card, CardContent, CardTitle } from "@/components/card";
import { IconTrendingDown, IconTrendingUp } from "@/components/icons";
import { DecimalString } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
    isWinning: boolean; // Indicates if the card is for winning or losing
    rate: number;
    rFactor: number;
    max: DecimalString;
    avg: DecimalString;
    streak: number;
}

export const WidgetGeneralStats: FC<Props> = (props) => {
    return (
        <Card className="flex h-full w-full flex-col gap-y-2">
            <CardTitle className="flex items-center justify-between gap-x-2">
                <div className="flex items-center gap-x-2">
                    {props.isWinning ? "Winning" : "Losing"}
                    {props.isWinning ? <IconTrendingUp size={24} /> : <IconTrendingDown size={24} />}
                </div>

                <div>{props.rate.toFixed(2)}%</div>
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
