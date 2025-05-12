import type { Meta } from "@storybook/react";
import { LuBold, LuItalic, LuUnderline } from "react-icons/lu";

import { ToggleGroup, ToggleGroupItem } from "@/s8ly";

const meta = {
    title: "s8ly/ToggleGroup",
    parameters: {
        layout: "centered",
    },
} satisfies Meta;

export default meta;

export const IconSingle = () => {
    return (
        <ToggleGroup type="single" variant="outline">
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <LuBold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <LuItalic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
                value="strikethrough"
                aria-label="Toggle strikethrough"
            >
                <LuUnderline className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );
};

export const Segment = () => {
    return (
        <ToggleGroup type="single" className="[&_*]:h-8">
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
                Equity
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
                Future
            </ToggleGroupItem>
            <ToggleGroupItem
                value="strikethrough"
                aria-label="Toggle strikethrough"
            >
                Option
            </ToggleGroupItem>
        </ToggleGroup>
    );
};

export const BuyOrSell = () => {
    return (
        <ToggleGroup type="single" className="[&_*]:h-8 [&_*]:w-18">
            <ToggleGroupItem variant="success" value="buy">
                Buy
            </ToggleGroupItem>
            <ToggleGroupItem variant="destructive" value="sell">
                Sell
            </ToggleGroupItem>
        </ToggleGroup>
    );
};
