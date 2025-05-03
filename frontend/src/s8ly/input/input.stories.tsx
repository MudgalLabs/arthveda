import type { Meta, StoryObj } from "@storybook/react";

import { WithLabel as WithLabelComp } from "@/components/with-label";
import { Password as PasswordComp } from "@/components/password";

import { Input as TextInputComp, Label } from "@/s8ly";

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
    },
};

export const Compact: Story = {
    args: {
        placeholder: "Enter your name",
        compact: true,
    },
};

export const HidePlaceholderOnFocus: Story = {
    args: {
        placeholder: "Enter your name",
        hidePlaceholderOnFocus: true,
    },
};

export const Password: Story = {
    render: () => <PasswordComp />,
};

export const WithLabel: Story = {
    render: () => (
        <WithLabelComp
            Label={<Label>Email</Label>}
            Input={<TextInputComp placeholder="mail@example.com" />}
        />
    ),
};
