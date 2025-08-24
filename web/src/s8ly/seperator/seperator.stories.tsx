import type { Meta } from "@storybook/react";

import { Separator as SeperatorComp } from "netra";

const meta = {
    title: "s8ly/Seperator",
    parameters: {
        layout: "centered",
    },
} satisfies Meta;

export default meta;

export function Separator() {
    return (
        <div>
            <div className="space-y-1">
                <h4 className="text-sm leading-none font-medium">Radix Primitives</h4>
                <p className="text-foreground-muted text-sm">An open-source UI component library.</p>
            </div>
            <SeperatorComp className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
                <div>Blog</div>
                <SeperatorComp orientation="vertical" />
                <div>Docs</div>
                <SeperatorComp orientation="vertical" />
                <div>Source</div>
            </div>
        </div>
    );
}
