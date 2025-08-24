import type { Meta, StoryObj } from "@storybook/react";

import { WithLabel as WithLabelComp } from "@/components/with_label";
import { WithCompare as WithCompareComp } from "@/components/with_compare";

import { Select as SelectComp, Label } from "netra";
import { CompareSelect } from "@/components/select/compare_select";

const meta = {
    title: "s8ly/Select",
    component: SelectComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof SelectComp>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
    { value: "1", label: "Item 1" },
    { value: "2", label: "Item 2" },
    { value: "3", label: "Item 3", disabled: true },
    { value: "4", label: "Item 4" },
];

export const Select: Story = {
    args: {
        options,
    },
};

export const Disabled: Story = {
    args: {
        options,
        disabled: true,
    },
};

export const WithLabel = () => {
    return (
        <WithLabelComp Label={<Label>Select something</Label>}>
            <SelectComp options={options} />
        </WithLabelComp>
    );
};

export const WithCompare = () => {
    return (
        <WithCompareComp Compare={<CompareSelect />}>
            <SelectComp options={options} />
        </WithCompareComp>
    );
};
