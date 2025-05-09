import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

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

export const SingleDate = () => {
    const [selectedDates, onDatesChange] = useState<Date[]>([]);

    return (
        <>
            <p className="mb-4">
                {selectedDates.length > 0
                    ? selectedDates[0].toLocaleDateString()
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

export const DateRange = () => {
    const [selectedDates, onDatesChange] = useState<Date[]>([]);

    return (
        <>
            <p className="mb-4">
                {selectedDates.length > 0
                    ? selectedDates
                          .map((d) => d.toLocaleDateString())
                          .join(" - ")
                    : "Select a date"}
            </p>
            <CalendarComp
                mode="range"
                selectedDates={selectedDates}
                onDatesChange={onDatesChange}
            />
        </>
    );
};
