import { OrderKind } from "@/features/trade/trade";
import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

interface OrderKindToggleProps {
    defaultValue?: OrderKind;
    value?: OrderKind;
    onChange?: (v: OrderKind) => void;
}

function OrderKindToggle({
    defaultValue,
    value,
    onChange,
}: OrderKindToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8 [&_*]:w-18"
            defaultValue={defaultValue}
            value={value}
            onValueChange={onChange}
            size="small"
        >
            <ToggleGroupItem variant="success" value="buy" aria-label="Buy">
                Buy
            </ToggleGroupItem>
            <ToggleGroupItem
                variant="destructive"
                value="sell"
                aria-label="Sell"
            >
                Sell
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export { OrderKindToggle };
export type { OrderKindToggleProps };
