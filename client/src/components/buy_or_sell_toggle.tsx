import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

type BuyOrSellState = "buy" | "sell" | "";

interface BuyOrSellToggleProps {
    defaultValue?: BuyOrSellState;
    value?: BuyOrSellState;
    onChange?: (v: BuyOrSellState) => void;
}

function BuyOrSellToggle({
    defaultValue,
    value,
    onChange,
}: BuyOrSellToggleProps) {
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

export { BuyOrSellToggle };
export type { BuyOrSellToggleProps, BuyOrSellState };
