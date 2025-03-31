import type { Meta, StoryObj } from "@storybook/react";

import { TextInput as TextInputComp } from "@/s8ly";

const meta = {
  title: "s8ly/TextInput",
  component: TextInputComp,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TextInputComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    placeholder: "Enter your name",
    hidePlaceholderOnFocus: false,
    disabled: false,
  },
};
