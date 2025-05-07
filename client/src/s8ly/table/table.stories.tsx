import type { Meta, StoryObj } from "@storybook/react";

import { Table as TableComp } from "@/s8ly";

const meta = {
    title: "s8ly/Table",
    component: TableComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof TableComp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Table: Story = {};
