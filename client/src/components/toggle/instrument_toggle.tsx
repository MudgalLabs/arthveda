import { InstrumentKind } from "@/features/trade/trade";
import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

interface SegmentToggleProps {
    defaultValue?: InstrumentKind;
    value?: InstrumentKind;
    onChange?: (v: InstrumentKind) => void;
}

function InstrumentToggle({
    defaultValue,
    value,
    onChange,
}: SegmentToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8"
            defaultValue={defaultValue}
            value={value}
            onValueChange={onChange}
            size="small"
        >
            <ToggleGroupItem value="equity" aria-label="Toggle equity">
                Equity
            </ToggleGroupItem>
            <ToggleGroupItem value="future" aria-label="Toggle future">
                Future
            </ToggleGroupItem>
            <ToggleGroupItem value="option" aria-label="Toggle option">
                Option
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export { InstrumentToggle };
