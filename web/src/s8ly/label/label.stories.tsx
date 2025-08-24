import type { Meta, StoryObj } from "@storybook/react";

import { Label as LabelComp } from "netra";

const meta = {
    title: "s8ly/Label",
    component: LabelComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof LabelComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Label: Story = {
    args: {
        children: "Label",
    },
};
