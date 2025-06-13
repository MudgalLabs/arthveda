import type { Meta, StoryObj } from "@storybook/react";

import { Tooltip as TooltipComp } from "@/s8ly";

const meta = {
    title: "s8ly/Tooltip",
    component: TooltipComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TooltipComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tooltip: Story = {
    args: {
        content: "Tooltip",
        children: <p>Hover me</p>,
        delayDuration: 0,
        contentProps: {
            side: "right",
        },
    },
};
