import type { Meta, StoryObj } from "@storybook/react";

import { Tag as TagComp } from "netra";

const meta = {
    title: "s8ly/Tag",
    component: TagComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TagComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { children: "Breakeven", variant: "default" },
};

export const Green: Story = {
    args: { children: "Win", variant: "success" },
};

export const Red: Story = {
    args: { children: "Loss", variant: "destructive" },
};

export const Filter: Story = {
    args: { children: "Status: Win", variant: "filter" },
};
