import type { Meta, StoryObj } from "@storybook/react";
import { MdOutlineSettings as IconSettings } from "react-icons/md";

import { Button } from "netra";

/**
 * Leaving storybook boiler template comments in here so that we can later come back here if we need it.
 */

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: "s8ly/Button",
    component: Button,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: "centered",
    },
    // // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    // tags: ["autodocs"],
    // // More on argTypes: https://storybook.js.org/docs/api/argtypes
    // argTypes: {
    //   backgroundColor: { control: "color" },
    // },
    // // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    // args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        children: "Button",
    },
};

export const PrimaryDisabled: Story = {
    args: {
        children: "Button",
        disabled: true,
    },
};

export const PrimaryLoading: Story = {
    args: {
        children: "Button",
        loading: true,
    },
};

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Button",
    },
};

export const SecondaryDisabled: Story = {
    args: {
        variant: "secondary",
        children: "Button",
        disabled: true,
    },
};

export const SecondaryLoading: Story = {
    args: {
        variant: "secondary",
        children: "Button",
        loading: true,
    },
};

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Button",
    },
};

export const OutlineDisabled: Story = {
    args: {
        variant: "outline",
        children: "Button",
        disabled: true,
    },
};

export const OutlineLoading: Story = {
    args: {
        variant: "outline",
        children: "Button",
        loading: true,
    },
};

export const Destructive: Story = {
    args: {
        variant: "destructive",
        children: "Button",
    },
};

export const DestructiveDisabled: Story = {
    args: {
        variant: "destructive",
        children: "Button",
        disabled: true,
    },
};

export const DestructiveLoading: Story = {
    args: {
        variant: "destructive",
        children: "Button",
        loading: true,
    },
};

export const Success: Story = {
    args: {
        variant: "success",
        children: "Button",
    },
};

export const SuccessDisabled: Story = {
    args: {
        variant: "success",
        children: "Button",
        disabled: true,
    },
};

export const SuccessLoading: Story = {
    args: {
        variant: "success",
        children: "Button",
        loading: true,
    },
};

export const Ghost: Story = {
    args: {
        variant: "ghost",
        children: "Button",
    },
};

export const GhostDisabled: Story = {
    args: {
        variant: "ghost",
        children: "Button",
        disabled: true,
    },
};

export const GhostLoading: Story = {
    args: {
        variant: "ghost",
        children: "Button",
        loading: true,
    },
};

export const Link: Story = {
    args: {
        variant: "link",
        children: "Button",
    },
};

export const LinkDisabled: Story = {
    args: {
        variant: "link",
        children: "Button",
        disabled: true,
    },
};

export const LinkLoading: Story = {
    args: {
        variant: "link",
        children: "Button",
        loading: true,
    },
};

export const Icon: Story = {
    args: {
        variant: "outline",
        size: "icon",
        children: <IconSettings size={20} />,
    },
};

export const IconDisabled: Story = {
    args: {
        variant: "outline",
        size: "icon",
        children: <IconSettings size={20} />,
        disabled: true,
    },
};

export const IconLoading: Story = {
    args: {
        variant: "outline",
        size: "icon",
        children: <IconSettings size={20} />,
        loading: true,
    },
};
