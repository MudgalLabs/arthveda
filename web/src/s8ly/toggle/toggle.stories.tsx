import type { Meta, StoryObj } from "@storybook/react";

import { Toggle as ToggleComp } from "netra";
import { IconEyeClose } from "@/components/icons";

const meta = {
    title: "s8ly/Toggle",
    component: ToggleComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof ToggleComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icon: Story = {
    args: {
        children: <IconEyeClose />,
    },
};

export const Outline: Story = {
    args: {
        children: <IconEyeClose />,
        variant: "outline",
    },
};

export const Disabled: Story = {
    args: {
        children: <IconEyeClose />,
        disabled: true,
    },
};

export const Text: Story = {
    args: {
        children: "Show",
    },
};
