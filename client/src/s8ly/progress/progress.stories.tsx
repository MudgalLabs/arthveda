import type { Meta } from "@storybook/react";

import { Progress as ProgressComp } from "@/s8ly";
import { useEffect, useState } from "react";

const meta = {
    title: "s8ly/Progress",
    parameters: {
        layout: "centered",
    },
} satisfies Meta;

export default meta;

export function Progress() {
    const [progress, setProgress] = useState(13);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(66), 500);
        return () => clearTimeout(timer);
    }, []);

    return <ProgressComp value={progress} className="w-[320px]" />;
}
