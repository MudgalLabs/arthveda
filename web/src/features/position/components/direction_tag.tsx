import { FC, memo } from "react";

import { Tag } from "@/s8ly";
import { PositionDirection, positionDirectionToString } from "@/features/position/position";

interface DirectionTagProps {
    direction: PositionDirection;
    className?: string;
}

const DirectionTag: FC<DirectionTagProps> = memo(({ direction, className }) => {
    if (!direction) {
        return null;
    }

    return <Tag className={className}>{positionDirectionToString(direction)}</Tag>;
});

export { DirectionTag };
