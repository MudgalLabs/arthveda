import type { Meta, StoryObj } from "@storybook/react";

import { Calendar as CalendarComp } from "@/s8ly";

const meta = {
    title: "s8ly/Calendar",
    component: CalendarComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof CalendarComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
