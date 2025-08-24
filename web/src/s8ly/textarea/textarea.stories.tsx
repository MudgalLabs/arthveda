import type { Meta, StoryObj } from "@storybook/react";

import { Textarea as TextareaComp } from "netra";

const meta = {
    title: "s8ly/Textarea",
    component: TextareaComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TextareaComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Textarea: Story = {
    args: {
        placeholder: "Enter your name",
        className: "w-96",
    },
};

export const Disabled: Story = {
    args: {
        placeholder: "Enter your name",
        className: "w-96",
        disabled: true,
    },
};
