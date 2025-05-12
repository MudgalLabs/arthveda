import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

type BuyOrSell = "buy" | "sell";

interface BuyOrSellToggleProps {
    defaultValue?: BuyOrSell;
    value?: BuyOrSell;
    onChange?: (v: BuyOrSell) => void;
}

function BuyOrSellToggle({
    defaultValue,
    value,
    onChange,
}: BuyOrSellToggleProps) {
    return (
        <ToggleGroup
            type="single"
            className="[&_*]:h-8"
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
export type { BuyOrSellToggleProps, BuyOrSell };
