import type { Meta, StoryObj } from "@storybook/react";

import { Input as InputComp, Label } from "@/s8ly";

import { WithLabel as WithLabelComp } from "@/components/with_label";
import { WithCompare as WithCompareComp } from "@/components/with_compare";
import { Password as PasswordComp } from "@/components/password";
import { CompareSelect as CompareSelect } from "@/components/select/compare_select";

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

export const HidePlaceholderOnFocus: Story = {
    args: {
        placeholder: "Enter your name",
        hidePlaceholderOnFocus: true,
    },
};

export const Disabeld: Story = {
    args: {
        placeholder: "Enter your name",
        disabled: true,
    },
};

export const Password: Story = {
    render: () => <PasswordComp />,
};

export const WithLabel = () => {
    return (
        <WithLabelComp Label={<Label>Email</Label>}>
            <InputComp placeholder="mail@example.com" type="email" />
        </WithLabelComp>
    );
};

export const WithCompare = () => {
    return (
        <WithCompareComp Compare={<CompareSelect />}>
            <InputComp placeholder="Price" type="number" />
        </WithCompareComp>
    );
};
