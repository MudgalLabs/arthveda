import type { Meta, StoryObj } from "@storybook/react";

import { Tag as TagComp } from "@/s8ly";

const meta = {
    title: "s8ly/Tag",
    component: TagComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TagComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: { children: "Breakeven", variant: "primary" },
};

export const Secondary: Story = {
    args: { children: "Open", variant: "secondary" },
};

export const Green: Story = {
    args: { children: "Win", variant: "success" },
};

export const Red: Story = {
    args: { children: "Loss", variant: "destructive" },
};
