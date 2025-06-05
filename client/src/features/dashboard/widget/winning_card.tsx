import { FC } from "react";
import { Card, CardContent, CardTitle } from "@/components/card";
import { IconTrendingUp } from "@/components/icons";
import { DecimalString } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface WinningCardProps {
    winRate: number;
    winRFactor: number;
    maxWin: DecimalString;
    avgWin: DecimalString;
    winStreak: number;
}

export const WinningCard: FC<WinningCardProps> = (props) => {
    return (
        <Card className="">
            <CardTitle className="text-success-foreground flex items-center justify-between gap-x-2">
                <div className="flex items-center gap-x-2">
                    Winning
                    <IconTrendingUp size={24} />
                </div>

                <div>{props.winRate}%</div>
            </CardTitle>

            <CardContent>
                <div className="h-2" />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                        <p className="label">R Factor</p>
                        <p className="heading">{props.winRFactor}</p>
                    </div>

                    <div>
                        <p className="label">Streak</p>
                        <p className="heading">{props.winStreak}</p>
                    </div>

                    <div>
                        <p className="label">Max</p>
                        <p className="heading">
                            {formatCurrency(props.maxWin)}
                        </p>
                    </div>

                    <div>
                        <p className="label">Avg</p>
                        <p className="heading">
                            {formatCurrency(props.avgWin)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
