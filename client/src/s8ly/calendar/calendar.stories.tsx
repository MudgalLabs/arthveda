import type { Meta } from "@storybook/react";
import { useState } from "react";

import { Calendar as CalendarComp } from "@/s8ly";
import { formatDate } from "@/lib/utils";

const meta = {
    title: "s8ly/Calendar",
    component: CalendarComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof CalendarComp>;

export default meta;

export const Single = () => {
    const [dates, setDates] = useState<Date[]>([]);

    return (
        <>
            <p className="mb-4">
                {dates.length > 0 ? formatDate(dates[0]) : "Select a date"}
            </p>
            <CalendarComp
                mode="single"
                dates={dates}
                onDatesChange={setDates}
            />
        </>
    );
};

export const Range = () => {
    const [dates, setDates] = useState<Date[]>([]);

    const from = dates[0];
    const to = dates[1];

    const formatted = () => {
        if (!from) return "Select range";

        let str = "";

        if (from) {
            str += formatDate(from);
        }

        if (to) {
            str += " - " + formatDate(to);
        }

        return str;
    };

    return (
        <>
            <p className="mb-4">{formatted()}</p>
            <CalendarComp mode="range" dates={dates} onDatesChange={setDates} />
        </>
    );
};
