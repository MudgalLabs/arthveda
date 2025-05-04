import type { Meta, StoryObj } from "@storybook/react";

import { Input as InputComp, Label } from "@/s8ly";

import { WithLabel as WithLabelComp } from "@/components/with-label";
import { Password as PasswordComp } from "@/components/password";

const meta = {
    title: "s8ly/Input",
    component: InputComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof InputComp>;

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
            Input={<InputComp placeholder="mail@example.com" />}
        />
    ),
};
