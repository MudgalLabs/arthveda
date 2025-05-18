import { FC, memo } from "react";

import { Tag } from "@/s8ly";
import {
    PositionDirection,
    positionDirectionToString,
} from "@/features/position/position";

interface DirectionTagProps {
    direction: PositionDirection;
    className?: string;
}

const DirectionTag: FC<DirectionTagProps> = memo(({ direction, className }) => {
    const isLong = direction === "long";
    return (
        <Tag className={className} variant={isLong ? "success" : "destructive"}>
            {positionDirectionToString(direction)}
        </Tag>
    );
});

export { DirectionTag };
