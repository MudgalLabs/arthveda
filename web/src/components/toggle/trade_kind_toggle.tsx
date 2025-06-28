import { TradeKind } from "@/features/trade/trade";
import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

interface OrderKindToggleProps {
    defaultValue?: TradeKind;
    value?: TradeKind;
    onChange?: (v: TradeKind) => void;
}

function OrderKindToggle({ defaultValue, value, onChange }: OrderKindToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8 [&_*]:w-18"
            defaultValue={defaultValue}
            value={value}
            onValueChange={onChange}
            size="small"
        >
            <ToggleGroupItem variant="default" value="buy" aria-label="Buy">
                Buy
            </ToggleGroupItem>
            <ToggleGroupItem variant="default" value="sell" aria-label="Sell">
                Sell
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export { OrderKindToggle };
export type { OrderKindToggleProps };
