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
    const [selectedDates, onDatesChange] = useState<Date[]>([]);

    return (
        <>
            <p className="mb-4">
                {selectedDates.length > 0
                    ? formatDate(selectedDates[0])
                    : "Select a date"}
            </p>
            <CalendarComp
                mode="single"
                selectedDates={selectedDates}
                onDatesChange={onDatesChange}
            />
        </>
    );
};

export const Range = () => {
    const [selectedDates, onDatesChange] = useState<Date[]>([]);

    const from = selectedDates[0];
    const to = selectedDates[1];

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
            <CalendarComp
                mode="range"
                selectedDates={selectedDates}
                onDatesChange={onDatesChange}
            />
        </>
    );
};
