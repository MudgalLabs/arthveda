import type { Meta } from "@storybook/react";

import { DatePicker } from "netra";
import { useState } from "react";

const meta = {
    title: "s8ly/DatePicker",
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

export function SingleWithTime() {
    const [dates, setDates] = useState<Date[]>([]);
    return <DatePicker mode="single" time dates={dates} onDatesChange={setDates} />;
}

export function RangeWithTime() {
    const [dates, setDates] = useState<Date[]>([]);
    return <DatePicker mode="range" time dates={dates} onDatesChange={setDates} />;
}
