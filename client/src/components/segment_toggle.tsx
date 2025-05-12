import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

type SegmentKind = "equity" | "future " | "options";

interface SegmentToggleProps {
    defaultValue?: SegmentKind;
    value?: SegmentKind;
    onChange?: (v: SegmentKind) => void;
}

function SegmentToggle({ defaultValue, value, onChange }: SegmentToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8"
            defaultValue={defaultValue}
            value={value}
            onValueChange={onChange}
            size="small"
        >
            <ToggleGroupItem value="equity" aria-label="Toggle equity segment">
                Equity
            </ToggleGroupItem>
            <ToggleGroupItem value="future" aria-label="Toggle future segment">
                Future
            </ToggleGroupItem>
            <ToggleGroupItem value="option" aria-label="Toggle option segment">
                Option
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export { SegmentToggle };
export type { SegmentKind };
