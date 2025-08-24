import { PositionDirection } from "@/features/position/position";
import { ToggleGroup, ToggleGroupItem } from "netra";

interface DirectionToggleProps {
    defaultValue?: PositionDirection | "";
    value?: PositionDirection | "";
    onChange?: (v: PositionDirection | "") => void;
}

export function DirectionToggle({ defaultValue, value, onChange }: DirectionToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8"
            defaultValue={defaultValue}
            value={value}
            onValueChange={onChange}
            size="small"
        >
            <ToggleGroupItem value="long" aria-label="Toggle long direction">
                Long
            </ToggleGroupItem>
            <ToggleGroupItem value="short" aria-label="Toggle short direction">
                Short
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
