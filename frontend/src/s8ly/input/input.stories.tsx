import type { Meta, StoryObj } from "@storybook/react";

import { InputWithLabel } from "@/components/input-with-label";

import { Input as TextInputComp } from "@/s8ly";

const meta = {
    title: "s8ly/TextInput",
    component: TextInputComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TextInputComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: "Enter your name",
        hidePlaceholderOnFocus: false,
        disabled: false,
    },
};

export const WithLabel: Story = {
    render: () => (
        <InputWithLabel
            label="Email"
            inputProps={{ placeholder: "mail@example.com" }}
        />
    ),
};
