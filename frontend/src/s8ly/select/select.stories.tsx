import type { Meta, StoryObj } from "@storybook/react";

import { Select as SelectComp } from "@/s8ly";

const meta = {
    title: "s8ly/Select",
    component: SelectComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof SelectComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Select: Story = {
    args: {
        items: [
            { value: "1", label: "Item 1" },
            { value: "2", label: "Item 2" },
            { value: "3", label: "Item 3" },
        ],
    },
};
