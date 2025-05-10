import type { Meta } from "@storybook/react";

import { DatePicker } from "@/s8ly";
import { useState } from "react";

const meta = {
    title: "s8ly/DatePicker",
    parameters: {
        layout: "centered",
    },
} satisfies Meta;

export default meta;

export function Single() {
    const [dates, setDates] = useState<Date[]>([]);
    return <DatePicker mode="single" dates={dates} onDatesChange={setDates} />;
}

export function Range() {
    const [dates, setDates] = useState<Date[]>([]);
    return <DatePicker mode="range" dates={dates} onDatesChange={setDates} />;
}
